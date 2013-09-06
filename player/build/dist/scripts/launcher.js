(function() {

  require(['player'], function(PlayerApplication) {
    window.onunload = (function() {});
    if (window.onPlayerReady) {
      return window.onPlayerReady(PlayerApplication);
    }
  });

}).call(this);
