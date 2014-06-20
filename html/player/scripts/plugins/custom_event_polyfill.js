(function() {
  define([], function() {
    var CustomEvent;
    if (window.CustomEvent) {
      return;
    }
    CustomEvent = function(event, params) {
      var evt;
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: void 0
      };
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };
    CustomEvent.prototype = window.Event.prototype;
    return window.CustomEvent = CustomEvent;
  });

}).call(this);
