var patch = function(a, b) {
  Object.keys(b).forEach(function(key){
    a[key] = b[key];
  });
  return a;
};

var P = Object.create(HTMLElement.prototype, {
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
  }
});

P.readAttributeAsJson = function(name) {
  if(!this.hasAttribute(name)) { return {}; };
  return JSON.parse(this.getAttribute(name));
};

P.attachedCallback = function(){
  console.log('attached');
  this.iframe = document.createElement('iframe');
  this.iframe.src = this.getAttribute('src');
  this.iframe.addEventListener('message', this.handleMessage.bind(this));

  this.appendChild(this.iframe);
};

P.attributeChangedCallback = function(name, old, value){
  switch(name) {
    case 'editable':
      this.sendMessage('editableChanged', { editable: this.editable });
      // Compat
      this.sendMessage('setEditable', { editable: this.editable });
      break;

    case 'data-config':
      this.sendMessage('attributesChanged', this.config);
      break;

    case 'data-userstate':
      this.sendMessage('learnerStateChanged', this.userstate);
      break;
  }
};

P.handleMessage = function(e){
  if(e.detail.event) {
    var event = e.detail.event;
    var data = e.detail.data;

    console.log('↖', event, data);

    var handlerName = 'on' + event[0].toUpperCase() + event.slice(1);
    if(this[handlerName]) {
      return this[handlerName](data);
    } else {
      // Can't handle that, re-translating event
      var evt = new CustomEvent(event, { detail: data, bubbles: true });
      this.dispatchEvent(evt);
    }
  }
};

P.sendMessage = function(event, data){
  var message = { event: event };
  if(data) { message.data = data; }
  if(this.iframe && this.iframe.contentWindow) {
    this.iframe.contentWindow.postMessage(message, '*');
    console.log('↘', message.event, message.data);
  }
};

P.onStartListening = function(){
  this.sendMessage('environmentChanged', this.env);
  this.sendMessage('attributesChanged', this.config);
  this.sendMessage('learnerstateChanged', this.userstate);
  this.sendMessage('editableChanged', { editable: this.editable });
  // Compat
  this.sendMessage('setEditable', { editable: this.editable });
  this.sendMessage('attached');
};

P.onSetHeight = function(data){
  var height = Math.min(data.pixels, 720);
  this.iframe.style.height = height + 'px';
};

P.onSetAttributes = function(data){
  var config = this.readAttributeAsJson('data-config');
  patch(config, data);
  this.setAttribute('data-config', JSON.stringify(config));
};

P.onSetLearnerState = function(data) {
  var userstate = this.readAttributeAsJson('data-userstate');
  patch(userstate, data);
  this.setAttribute('data-userstate', JSON.stringify(userstate));
};

P.onGetPath = function(data) {
  console.warn('getPath/setPath are obsolete');
  var assetUrlTemplate = this.env && this.env.assetUrlTemplate;
  if(assetUrlTemplate) {
    var url = assetUrlTemplate.replace('<%= id %>', data.assetId );
    this.sendMessage('setPath', { url: url});
  };
};

window.addEventListener('message', function(e){
  var iframes = document.querySelectorAll('versal-launcher > iframe');
  Array.prototype.forEach.call(iframes, function(iframe){
    if(iframe.contentWindow == e.source) {
      iframe.dispatchEvent(new CustomEvent('message', { detail: e.data }));
    }
  })
});

document.registerElement('versal-launcher', { prototype: P });
