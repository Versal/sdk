var SUPPORTED_IMAGE_TYPES = ['jpg','jpeg','png','gif'];

var Semver = function(ver) {
  var segs = ver.split('.');
  return { major: (segs[0] || 0), minor: (segs[1] || 0), patch: (segs[2] || 0), version: ver };
};

var isValidFileType = function(extension) {
  return SUPPORTED_IMAGE_TYPES.indexOf(extension) >= 0;
};

var createAssetInput = function() {
  var assetInput = document.createElement('input');

  assetInput.type = 'file';
  assetInput.style.display = 'none';
  assetInput.id = 'asset-input';

  // Stop event propagation to make sure we don't set editable state to false
  //  - when we click on the input[type="file"]
  assetInput.onclick = function(event) {
    event.stopPropagation();
  };

  return assetInput;
};

var createAssetDropzone = function() {
  var assetDropzone = document.createElement('div');
  var innerHTML = '<div class="dropzone-dialog"><div class="dropzone-prompt">Drop file here or click to upload</div>';
  innerHTML += '<div class="dropzone-cancel-dialog">cancel</div></div>';

  assetDropzone.innerHTML = innerHTML;
  assetDropzone.className = 'asset-dropzone hidden';

  return assetDropzone;
};

var onDragOverDropzone = function(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
};

var createLoadingOverlay = function() {
  var loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'asset-loading-overlay hidden';
  loadingOverlay.innerHTML = '<div class="asset-loading-indicator">Uploading asset...</div>';

  return loadingOverlay;
};

var postAsset = function(url, sessionId, assetData, callback) {
  var request = new XMLHttpRequest();

  var formData = new FormData();
  Object.keys(assetData).forEach(function(key) {
    if (key === 'tags') {
      formData.append(key, JSON.stringify(assetData[key]));
    } else {
      formData.append(key, assetData[key]);
    }
  });

  request.onload = function() {
    if (request.readyState == 4) {
      if (request.status == 201) {
        return callback(null, JSON.parse(request.responseText));
      } else {
        return callback(new Error('Something went wrong when uploading an asset. please try again'));
      }
    }
  };

  request.open('POST', url + '/assets', true);
  request.setRequestHeader('SID', sessionId);
  request.send(formData);
};

var serializeFile = function(file) {
  var fileNameSplit = file.name.split('.'),
      extension     = fileNameSplit[fileNameSplit.length - 1] || '',
      contentType   = file.type || 'image/x-' + extension;

  if (!isValidFileType(extension.toLowerCase())) {
    return console.warn('invalid file type:', extension);
  }

  var attributes = {
    title:        'New File',
    type:         'image',
    tags:         ['image'],
    content:      file,
    contentType:  contentType
  };

  return attributes;
};

var patch = function(to, from) {
  if(from) {
    Object.keys(from).forEach(function(key){
      to[key] = from[key];
      if (to[key] === null) {
        delete to[key];
      }
    });
  }
  return to;
};

var isNullish = function(obj) {
  return obj == null; // jshint ignore:line
};

var JSONDeepEquals = function(o1, o2) {
  if (typeof o1 !== "object" || typeof o1 !== typeof o2 || isNullish(o1) || isNullish(o2)) {
    return o1 === o2;
  }

  var k1 = Object.keys(o1).sort();
  var k2 = Object.keys(o2).sort();
  if (k1.length != k2.length) return false;

  for (var i=0; i<k1.length; i++) {
    if (!JSONDeepEquals(o1[k1[i]], o2[k2[i]])) return false;
  }
  return true;
};

var prototype = Object.create(HTMLElement.prototype, {
  src: {
    get: function(){ return this.getAttribute('src') || 'about:blank'; }
  },

  editable: {
    get: function(){ return this.getAttribute('editable') == 'true'; }
  },

  env: {
    get: function(){ return this.readAttributeAsJson('data-environment'); }
  },

  config: {
    get: function(){ return this.readAttributeAsJson('data-config'); }
  },

  userstate: {
    get: function(){ return this.readAttributeAsJson('data-userstate'); }
  },

  debug: {
    get: function(){ return this.hasAttribute('debug'); }
  },

  apiVersion: {
    get: function(){
      if(!this._apiVersion) {
        this._apiVersion = new Semver(this.getAttribute('data-api-version') || '0.0.0');
      }
      return this._apiVersion;
    }
  }
});

prototype.readAttributeAsJson = function(name) {
  if(!this.hasAttribute(name)) { return {}; }
  return JSON.parse(this.getAttribute(name));
};

prototype.log = function(dir, event, data) {
  if(this.debug) { console.log(dir, event, data); }
};

prototype.createdCallback = function() {
  this._previousMessages = {};
};

prototype.attachedCallback = function(){
  // avoid problems in case attachedCallback is called multiple times while detachedCallback is not called
  if (this.iframe) {
    if (this.iframe.src != this.src) this.iframe.src = this.src;
    return;
  }

  this.iframe = document.createElement('iframe');
  this.iframe.src = this.src;
  this.iframe.addEventListener('message', this.handleMessage.bind(this));
  this.iframe.setAttribute('allowfullscreen', 'allowfullscreen');

  this.appendChild(this.iframe);

  this.assetInput     = createAssetInput();
  this.loadingOverlay = createLoadingOverlay();
  this.assetDropzone  = createAssetDropzone();

  this.appendChild(this.assetInput);
  this.appendChild(this.assetDropzone);
  this.appendChild(this.loadingOverlay);
};

prototype.detachedCallback = function(){
  this.removeChild(this.iframe);
  this.iframe = null;
  this.removeChild(this.assetInput);
  this.removeChild(this.assetDropzone);
  this.removeChild(this.loadingOverlay);
  this._reset();
};

prototype._reset = function(){
  this._previousMessages = {};
  window.clearTimeout(this._attributesChangedTimeout);
  window.clearTimeout(this._learnerStateChangedTimeout);
};

prototype.attributeChangedCallback = function(name, oldAttribute, newAttribute){
  switch(name) {
    case 'editable':
      this.sendMessage('editableChanged', { editable: this.editable });
      if(this.apiVersion.minor < 1) {
        this.sendMessage('setEditable', { editable: this.editable });
      }
      if (this.assetDropzone) { this.hideAssetDropzone(); }
      break;

    case 'data-config':
      window.clearTimeout(this._attributesChangedTimeout);
      this._attributesChangedTimeout = window.setTimeout((function() {
        this.sendMessage('attributesChanged', this.config);
      }).bind(this));
      break;

    case 'data-userstate':
      window.clearTimeout(this._learnerStateChangedTimeout);
      this._learnerStateChangedTimeout = window.setTimeout((function() {
        this.sendMessage('learnerStateChanged', this.userstate);
      }).bind(this));
      break;
  }
};

prototype.handleMessage = function(event) {
  if(event.detail.event) {
    var eventName = event.detail.event;
    var data = event.detail.data;

    this.log('↖', eventName, data);

    var handler = this.messageHandlers[eventName];
    if(handler) {
      handler.call(this, data);
    } else {
      console.error('Unknown event received: ' + eventName);
      this.error({message: 'Unknown event received: ' + eventName});
    }
  }
};

prototype.sendMessage = function(eventName, data) {
  if (!this._listening) return;
  if (JSONDeepEquals(this._previousMessages[eventName], data)) return;

  var message = { event: eventName };
  if(data) { message.data = data; }
  if(this.iframe && this.iframe.contentWindow) {
    this.iframe.contentWindow.postMessage(message, '*');
    this.log('↘', message.event, message.data);
    this._previousMessages[eventName] = data;
  }
};

prototype.fireCustomEvent = function(eventName, data, options) {
  options = options || {};
  var evt = new CustomEvent(eventName, { detail: data, bubbles: options.bubbles || false });
  this.dispatchEvent(evt);
};

prototype.hideAssetDropzone = function() {
  this.assetDropzone.className = 'asset-dropzone hidden';
  this.assetDropzone.removeEventListener('drop', this.onDropAssetDropzone);
  this.assetDropzone.removeEventListener('dragover', onDragOverDropzone);
};

prototype.onDropAssetDropzone = function(data, event) {
  event.stopPropagation();
  event.preventDefault();
  var dataTransfer = event.dataTransfer;

  if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
    this.uploadAssetAndSetAttributes(data, dataTransfer.files[0]);
  }
};

prototype.setupDropzoneHandlers = function(requestData) {
  this.assetDropzone.onclick = function() {
    this.assetInput.click();
  }.bind(this);

  this.querySelector('.dropzone-cancel-dialog').onclick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.hideAssetDropzone();
  }.bind(this);

  this.assetDropzone.addEventListener('dragover', onDragOverDropzone, false);
  this.assetDropzone.addEventListener('drop', this.onDropAssetDropzone.bind(this, requestData), false);
};

prototype.uploadAssetAndSetAttributes = function(data, file) {
  var apiUrl      = this.env.apiUrl,
      sessionId   = this.env.sessionId,
      serializedFile = serializeFile(file);

  if (!serializedFile) { return; }

  // To patch attributesChanged if author toggles out of gadget editing
  this.uploadingAsset = true;

  this.assetDropzone.className  = 'asset-dropzone hidden';
  this.loadingOverlay.className = 'asset-loading-overlay';

  postAsset(apiUrl, sessionId, serializedFile, function(error, assetJson) {
    this.loadingOverlay.className = 'asset-loading-overlay hidden';
    if (error) {
      return alert(error.message);
    }

    assetAttributes = {};
    assetAttributes[data.attribute] = assetJson;

    this.sendMessage('attributesChanged', assetAttributes);
    // After a period of time allotted to communicate the change to 'attributesChanged'		
    // set uploadingAsset to false		
    setTimeout(function() { this.uploadingAsset = false; }.bind(this), 1000);
  }.bind(this));
};

prototype.messageHandlers = {
  startListening: function(){
    this._reset();
    this._listening = true;
    this.sendMessage('environmentChanged', this.env);
    this.sendMessage('attributesChanged', this.config);
    this.sendMessage('learnerStateChanged', this.userstate);
    this.sendMessage('editableChanged', { editable: this.editable });
  },

  setHeight: function(data){
    this.iframe.style.height = data.pixels + 'px';
    if (!this._firedRendered) {
      this._firedRendered = true;
      this.fireCustomEvent('rendered');
    }
  },

  setAttributes: function(data){
    if(!this.editable && !this.uploadingAsset) {
      console.warn('Unable to setAttributes in the read-only state');
      return;
    }
    var config = this.readAttributeAsJson('data-config');
    patch(config, data);
    this.setAttribute('data-config', JSON.stringify(config));

    // Player needs those events, until we have mutation observers in place
    this.fireCustomEvent('setAttributes', config);
  },

  setLearnerState: function(data) {
    var userstate = this.readAttributeAsJson('data-userstate');
    patch(userstate, data);
    this.setAttribute('data-userstate', JSON.stringify(userstate));

    // Player needs those events, until we have mutation observers in place
    this.fireCustomEvent('setLearnerState', userstate);
  },

  getPath: function(data) {
    console.warn('getPath/setPath are obsolete');
    var assetUrlTemplate = this.env && this.env.assetUrlTemplate;
    if(assetUrlTemplate) {
      var url = assetUrlTemplate.replace('<%= id %>', data.assetId );
      this.sendMessage('setPath', { url: url});
    }
  },

  setPropertySheetAttributes: function(data) { this.fireCustomEvent('setPropertySheetAttributes', data); },
  track: function(data) { this.fireCustomEvent('track', data, {bubbles: true}); },
  error: function(data) { this.fireCustomEvent('error', data, {bubbles: true}); },
  requestAsset: function(data) {
    // TODO support other updload types
    //if (data.type == 'video') {
    return this.fireCustomEvent('requestAsset', data);
    //}

    this.assetDropzone.className = 'asset-dropzone';
    this.setupDropzoneHandlers(data);

    this.assetInput.onchange = function(e) {
      if (e && e.target && e.target.files && e.target.files[0]) {
        this.uploadAssetAndSetAttributes(data, e.target.files[0]);
      }
    }.bind(this);
  },

  // Soon to be deprecated in favour of in-iframe APIs
  // E.g. https://github.com/Versal/challenges-js-api/
  setEmpty: function(data) { this.fireCustomEvent('setEmpty', data); },
  changeBlocking: function(data) { this.fireCustomEvent('changeBlocking', data); }
};

window.addEventListener('message', function(event){
  var iframes = document.querySelectorAll('versal-iframe-launcher > iframe');
  Array.prototype.forEach.call(iframes, function(iframe){
    if(iframe.contentWindow == event.source) {
      iframe.dispatchEvent(new CustomEvent('message', { detail: event.data }));
    }
  });
});

document.registerElement('versal-iframe-launcher', { prototype: prototype });
