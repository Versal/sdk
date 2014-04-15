var _each = Array.prototype.forEach;
var URL = webkitURL || URL;

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

  palette.addEventListener('click', function(e){
    var manifest = JSON.parse(e.target.getAttribute('data-manifest'));
    var element = 'versal-launcher';

    var elt = document.createElement(element);
    elt.setAttribute('src', assetPath(manifest, 'index.html'));
    elt.setAttribute('data-environment', JSON.stringify(window.env));

    if(editable.checked) {
      elt.setAttribute('editable', 'true');
    };

    if(manifest.defaultConfig) {
      console.warn('defaultConfig is a subject to deprecation. Consider providing default configuration in the gadget.');
      elt.setAttribute('data-config', JSON.stringify(manifest.defaultConfig));
    }

    if(manifest.defaultUserstate) {
      console.warn('defaultUserstate is a subject to deprecation. Consider providing default userstate within the gadget.');
      elt.setAttribute('data-userstate', JSON.stringify(manifest.defaultUserstate));
    }

    container.innerHTML = '';
    container.appendChild(elt);

    persistenceObserver.disconnect();
    persistenceObserver.observe(elt, {
      attributes: true,
      attributeFilter: ['data-config', 'data-userstate']
    });
  });
};

var linkManifest = function(manifest) {
  var icon = createIcon(assetPath(manifest, 'assets/icon.png'));
  icon.setAttribute('data-manifest', JSON.stringify(manifest));
  palette.appendChild(icon);
};

var createIcon = function(src){
  var span = document.createElement('span');
  span.className = 'icon';
  span.style.backgroundImage = 'url(' + src + ')';
  return span;
}

var assetPath = function(manifest, file) {
  return '/api/gadgets/' + manifest.username + '/' + manifest.name + '/' + manifest.version + '/' + file;
};

var persistenceObserver = new MutationObserver(function(mx){
  mx.forEach(function(mutation){
    if(mutation.type == 'attributes') {
      saving.textContent = mutation.attributeName.slice(5);
      saving.classList.add('visible');
      setTimeout(function(){
        saving.classList.remove('visible');
      }, 500);
    }
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

/*

var createLauncher = function(element, data){
  var launcher = document.createElement(element);
  Object.keys(data).forEach(function(key){
    launcher.setAttribute(key, data[key]);
  });
  return launcher;
};

var linkElement = function(manifest){
  var link = document.createElement('link');
  link.rel = 'import';
  var href = elementPath(manifest, (manifest.launcher_path || 'index.html'))
  link.href = href;
  link.onload = registerManifest;
  document.head.appendChild(link);
};

var registerManifest = function(evt) {
  var link = evt.target;
  if(link.import) {
    var icon = link.import.querySelector('.icon');
    var element = link.import.querySelector('versal-element');
    var span = createIcon(icon.src);
    span.setAttribute('data-element', element.getAttribute('name'));
    palette.appendChild(span);
  }
};

var elementPath = function(manifest, file) {
  return '/elements/' + manifest.name + '/' + manifest.version + '/' + file;
};
*/
