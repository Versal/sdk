(function() {

  define(['./metrics/ga', './metrics/versal_analytics'], function(googHandler, versalHandler) {
    var log;
    log = function() {
      googHandler.apply(this, arguments);
      return versalHandler.apply(this, arguments);
    };
    window.onerror = function(message, url, line) {
      return log('Error', message, {
        url: url,
        line: line
      });
    };
    return log;
  });

}).call(this);
