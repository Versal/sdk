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

var JSONDeepEquals = function(o1, o2) {
  if (typeof o1 !== "object" || typeof o1 !== typeof o2 || o1 == null || o2 == null) {
    return o1 === o2;
  }

  var k1 = Object.keys(o1).sort();
  var k2 = Object.keys(o2).sort();
  if (k1.length != k2.length) return false;

  for (var i=0; i<k1.length; i++) {
    if (!JSONDeepEquals(o1[k1[i]], o2[k2[i]])) return false;
  }
  return true;
}

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

prototype.createdCallback = function() {
  this._previousMessages = {}
};

prototype.attachedCallback = function(){
  this.iframe = document.createElement('iframe');
  this.iframe.src = this.src;
  this.iframe.addEventListener('message', this.handleMessage.bind(this));
  this.iframe.setAttribute('allowfullscreen', 'allowfullscreen');

  this.appendChild(this.iframe);
};

prototype.detachedCallback = function(){
  this.removeChild(this.iframe);
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

prototype.messageHandlers = {
  startListening: function(){
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
  requestAsset: function(data) { this.fireCustomEvent('requestAsset', data); },

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
