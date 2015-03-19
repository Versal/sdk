var EventEmitter = require('events').EventEmitter;

//  This Player thing should be used inside gadget
//  as a convenience API over postMessage.
//
//  Supported events:
//  https://github.com/Versal/versal-gadget-launchers/tree/master/iframe-launcher
var PlayerAPI = function(options){
  EventEmitter.call(this);

  this.eventSource = (options && options.eventSource) || window.parent;

  // TODO: don't communicate assets in setAttributes event in the player
  this._assetAttributes = {};
  this._assetCallbacks = {};

  if(typeof window != 'undefined'){
    window.addEventListener('message', this.handleMessage.bind(this));

    window.addEventListener('DOMContentLoaded', function(){
      // To prevent scrolling within iframe gadgets
      document.body.style.overflow = 'hidden';
    });

    if(options && options.debug){
      window.addEventListener('message', function(evt){
        if(evt.data && evt.data.event) {
          console.log('Gadget received message from SDK:', evt.data.event, evt.data.data);
        }
      });
    }
  }
};

PlayerAPI.prototype = Object.create(EventEmitter.prototype);

PlayerAPI.prototype.addEventListener = PlayerAPI.prototype.addListener;
PlayerAPI.prototype.removeEventListener = PlayerAPI.prototype.removeListener;

PlayerAPI.prototype.sendMessage = function(name, data) {
  var message = { event: name };
  if(data) { message.data = data; }

  this.eventSource.postMessage(message, '*');
};

PlayerAPI.prototype.handleMessage = function(evt) {
  var message = evt.data;

  if(message && message.event) {
    this.emit('message', message);

    // Inspect attributes for asset-related fields and extract asset json
    if(message.event == 'attributesChanged') {
      this._triggerAssetCallbacks(message.data);
    }

    this.emit(message.event, message.data);

    if(message.event == 'environmentChanged') {
      this.assetUrlTemplate = message.data.assetUrlTemplate;
      this.userId = message.data.userId;
      this.sessionId = message.data.sessionId;
    }
  }
};

// TODO: move implementation to the player
PlayerAPI.prototype._triggerAssetCallbacks = function(attrs){
  Object.keys(this._assetAttributes).forEach(function(name){
    if(this._assetAttributes[name] != true) { return; }

    if(attrs[name]) {
      var asset = attrs[name];
      this.emit('assetSelected', { name: name, asset: asset });
      this._assetAttributes[name] = null;

      if(this._assetCallbacks[name]) {
        this._assetCallbacks[name].call(this, asset);
      }
    }
  }.bind(this));
};

PlayerAPI.prototype.startListening = function(){
  this.sendMessage('startListening');
};

PlayerAPI.prototype.setHeight = function(px) {
  if (px === this._lastSetHeight) return;
  this._lastSetHeight = px;
  this.sendMessage('setHeight', { pixels: px });
};

PlayerAPI.prototype.setHeightToBodyHeight = function() {
  this.setHeight(document.body.offsetHeight);
};

PlayerAPI.prototype.watchBodyHeight = function(options) {
  this.unwatchBodyHeight();
  this.setHeightToBodyHeight();

  options = options || {};
  options.interval = options.interval || 32; // 2 frame refreshes at 60Hz, see https://github.com/davidjbradshaw/iframe-resizer/blob/v2.5.2/README.md#interval

  this._bodyHeightInterval = setInterval(this.setHeightToBodyHeight.bind(this), options.interval);
};

PlayerAPI.prototype.unwatchBodyHeight = function() {
  if (this._bodyHeightInterval === undefined) return;
  clearInterval(this._bodyHeightInterval);
  delete this._bodyHeightInterval;
};

PlayerAPI.prototype.setAttribute = function(name, value){
  var attr = {};
  attr[name] = value;
  this.setAttributes(attr);
};

PlayerAPI.prototype.setAttributes = function(attrs) {
  this.sendMessage('setAttributes', attrs);
};

/*
 * Deprecation Notice
 * We discourage the use of setLearnerAttribute and setLearnerAttributes
 * in favor of setLearnerState
*/
PlayerAPI.prototype.setLearnerAttribute = function(name, value){
  var attr = {};
  attr[name] = value;
  this.setLearnerState(attr);
};

/*
 * Deprecation Notice
 * We discourage the use of setLearnerAttribute and setLearnerAttributes
 * in favor of setLearnerState
*/
PlayerAPI.prototype.setLearnerAttributes = function(attrs) {
  this.sendMessage('setLearnerState', attrs);
};

PlayerAPI.prototype.setLearnerState = function(attrs) {
  this.sendMessage('setLearnerState', attrs);
};

PlayerAPI.prototype.setPropertySheetAttributes = function(attrs){
  this.sendMessage('setPropertySheetAttributes', attrs);
};

PlayerAPI.prototype.track = function(name, _data){
  var data = { '@type': name };
  Object.keys(_data).forEach(function(key){
    data[key] = _data[key];
  });
  this.sendMessage('track', data);
};

PlayerAPI.prototype.error = function(data){
  this.sendMessage('error', data);
};

PlayerAPI.prototype.requestAsset = function(data, callback){
  if(!data.attribute) {
    var seed = Math.random().toString(36).substring(7);
    data.attribute = '__asset__' + seed;
  }
  // TODO: remove this after assets are communicated from the player
  // in a dedicated event
  this._assetAttributes[data.attribute] = true;

  if(callback) {
    this._assetCallbacks[data.attribute] = callback;
  }
  this.sendMessage('requestAsset', data);
};

PlayerAPI.prototype.assetUrl = function(id){
  return this.assetUrlTemplate.replace(/<%= id %>/, id);
};

module.exports = PlayerAPI;

window.VersalPlayerAPI = PlayerAPI;
