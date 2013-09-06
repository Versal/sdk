(function() {

  define([], function() {
    return function(data) {
      return window.parent.postMessage(JSON.stringify(data), '*');
    };
  });

}).call(this);
