var _each = Array.prototype.forEach;
var URL = window.webkitURL || window.URL;

var palette = document.querySelector('.palette');
var container = document.querySelector('.lesson');
var assetPicker = document.querySelector('.asset-picker');
var saving = document.querySelector('.saving');

var get = function(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.send();

  request.onload = function(){
    if(request.status != 200) { return callback(new Error(request.response)); }
    callback(null, JSON.parse(request.response));
  };

  request.onerror = function(err){
    callback(err);
  };
};

var put = function(url, callback) {
  var request = new XMLHttpRequest();
  request.open('PUT', url, true);
  request.send();

  request.onload = function(){
    if(request.status != 200) { return callback(new Error(request.response)); }
    callback(null, JSON.parse(request.response));
  };

  request.onerror = function(err){
    callback(err);
  };
};

get('/api/courses/local', function(err, course){
  window.env = {
    assetUrlTemplate: course.assetUrlTemplate
  };

  get('/api/manifests', function(err, manifests){
    initPalette(manifests)
  });
});

var initPalette = function(manifests){
  _each.call(manifests, linkManifest);

  palette.addEventListener('preview', function(e){
    var manifest = JSON.parse(e.target.getAttribute('data-manifest'));
    var gbox = createGbox(manifest);
    container.appendChild(gbox);
  });

  palette.addEventListener('upload', function(e){
    put('/api/sandbox?id=' + e.target.manifest.id, function(error, response){
      if(error) {
        alert(error);
        return console.error(error);
      }

      console.log(response);
    });
  });
};

var createGbox = function(manifest){
  var gbox = document.createElement('gadget-box');
  var launcher = createLauncher('versal-iframe-launcher', manifest)
  gbox.appendChild(launcher);
  return gbox;
};

var createLauncher = function(element, manifest){
  var elt = document.createElement(element);

  elt.id = Math.random().toString(36).substr(2,6);
  elt.setAttribute('src', assetPath(manifest, manifest.main));
  elt.setAttribute('data-environment', JSON.stringify(window.env));
  elt.setAttribute('data-config', JSON.stringify(manifest.defaultConfig || {}));
  elt.setAttribute('data-userstate', JSON.stringify(manifest.defaultUserState || {}));

  return elt;
};

var linkManifest = function(manifest) {
  var icon = document.createElement('gadget-manifest');
  icon.setAttribute('data-manifest', JSON.stringify(manifest));
  icon.setAttribute('data-icon', assetPath(manifest, manifest.icon))
  palette.appendChild(icon);
};

var assetPath = function(manifest, file) {
  return '/api/gadgets/' + manifest.username + '/' + manifest.name + '/' + manifest.version + '/' + file;
};

var persistenceObserver = new MutationObserver(function(records){
  records.forEach(function(mr){
    var attr = mr.attributeName;
    sessionStorage[attr] = mr.target.getAttribute(attr);

    saving.textContent = attr.slice(5);
    saving.classList.add('visible');
    setTimeout(function(){
      saving.classList.remove('visible');
    }, 500);
  })
});

container.addEventListener('dragenter', function(e){
  e.preventDefault();
});
container.addEventListener('dragover', function(e){
  e.preventDefault();
});

container.addEventListener('drop', function(e){
  console.log(e);
  var manifest = JSON.parse(e.dataTransfer.getData('application/json'));
  var gbox = createGbox(manifest);
  e.target.appendChild(gbox);
  e.preventDefault();
});

container.addEventListener('requestAsset', function(evt){
  var requester = evt.target;
  var attribute = evt.detail.attribute;

  assetPicker.classList.add('visible');

  assetPicker.onsubmit = function(e){
    e.preventDefault();
    var request = new XMLHttpRequest();
    request.open('POST', '/api/assets', true);
    request.send(new FormData(assetPicker));

    request.onload = function(){
      if(request.status > 201) {
        return console.error(request.response);
      }

      var assetJson = JSON.parse(request.response);
      var data = {};
      data[attribute] = assetJson;
      requester.sendMessage('attributesChanged', data);
      assetPicker.classList.remove('visible');
    };

    request.onerror = function(err){
      console.error(err);
    };
  };

  assetPicker.onreset = function(){
    assetPicker.classList.remove('visible');
  }
});
