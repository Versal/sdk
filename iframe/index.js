var _each = Array.prototype.forEach;
var URL = window.webkitURL || window.URL;

var palette = document.querySelector('.palette');
var container = document.querySelector('.container');
var assetPicker = document.querySelector('.asset-picker');
var saving = document.querySelector('.saving');
var editable = document.querySelector('#editable');

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
    var
  });

  palette.addEventListener('upload', function(e){
    put('/api/sandbox?id=' + e.target.manifest.id, function(error, response){
      if(error) {
        return console.error(error);
      }

      console.log(response);
    });
  });
};

var previewGadget = function(element, attributes){
  var elt = document.createElement(element);

  elt.id = Math.random().toString(36).substr(2,6);
  elt.setAttribute('src', assetPath(manifest, manifest.main));
  elt.setAttribute('data-environment', JSON.stringify(window.env));

  if(editable.checked) {
    elt.setAttribute('editable', 'true');
  };

  Object.keys(attributes).forEach(function(key){
    elt.setAttribute(key, attributes[key]);
  });

  Object.keys(userstate).forEach(function(key){
    elt.setAttribute(key, userstate[key]);
  });

  container.innerHTML = '';
  container.appendChild(elt);
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

editable.addEventListener('change', function(){
  _each.call(container.children, function(elt){
    if(editable.checked) {
      elt.setAttribute('editable', 'true');
    } else {
      elt.removeAttribute('editable');
    }
  })
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
