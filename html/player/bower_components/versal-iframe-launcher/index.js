var Semver = function(ver) {
  var segs = ver.split('.');
  return { major: (segs[0] || 0), minor: (segs[1] || 0), patch: (segs[2] || 0), version: ver };
};

var patch = function(to, from) {
  Object.keys(from).forEach(function(key){
    to[key] = from[key];
  });
  return to;
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
      };
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

prototype.attachedCallback = function(){
  this.iframe = document.createElement('iframe');
  this.iframe.src = this.src;
  this.iframe.addEventListener('message', this.handleMessage.bind(this));

  this.appendChild(this.iframe);
};

prototype.detachedCallback = function(){
  this.removeChild(this.iframe);
}

prototype.attributeChangedCallback = function(name){
  switch(name) {
    case 'editable':
      this.sendMessage('editableChanged', { editable: this.editable });
      if(this.apiVersion.minor < 1) {
        this.sendMessage('setEditable', { editable: this.editable });
      }
      break;

    case 'data-config':
      this.sendMessage('attributesChanged', this.config);
      break;

    case 'data-userstate':
      this.sendMessage('learnerStateChanged', this.userstate);
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
      this.fireCustomEvent('error', {message: 'Unknown event received: ' + eventName});
    }
  }
};

prototype.sendMessage = function(eventName, data) {
  var message = { event: eventName };
  if(data) { message.data = data; }
  if(this.iframe && this.iframe.contentWindow) {
    this.iframe.contentWindow.postMessage(message, '*');
    this.log('↘', message.event, message.data);
  }
};

prototype.fireCustomEvent = function(eventName, data) {
  var evt = new CustomEvent(eventName, { detail: data, bubbles: true });
  this.dispatchEvent(evt);
};

prototype.messageHandlers = {
  startListening: function(){
    this.sendMessage('environmentChanged', this.env);
    this.sendMessage('attributesChanged', this.config);
    this.sendMessage('learnerStateChanged', this.userstate);
    this.sendMessage('editableChanged', { editable: this.editable });
    // Compat
    this.sendMessage('setEditable', { editable: this.editable });
    this.sendMessage('attached');
  },

  setHeight: function(data){
    this.iframe.style.height = data.pixels + 'px';
  },

  setAttributes: function(data){
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
  setEmpty: function(data) { this.fireCustomEvent('setEmpty', data); },
  track: function(data) { this.fireCustomEvent('track', data); },
  error: function(data) { this.fireCustomEvent('error', data); },
  changeBlocking: function(data) { this.fireCustomEvent('changeBlocking', data); },
  requestAsset: function(data) { this.fireCustomEvent('requestAsset', data); }
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