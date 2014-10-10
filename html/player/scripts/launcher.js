(function() {
  var config;

  window.vs || (window.vs = {});

  require.config(config = {
    waitSeconds: 120,
    baseUrl: 'scripts',
    paths: {
      player: 'player-bundle'
    }
  });

  require(['player'], function(PlayerApplication) {
    window.onunload = (function() {});
    window.addEventListener('message', function(e) {
      if (e.data.event === 'environmentChanged') {
        return window.player = new PlayerApplication(e.data.data);
      }
    });
    window.addEventListener('message', function(e) {
      var data, err;
      if (typeof e.data !== 'string') {
        return;
      }
      try {
        data = JSON.parse(e.data);
        if (data.event === 'player:launch') {
          return window.player = new PlayerApplication(data);
        }
      } catch (_error) {
        err = _error;
        return typeof console !== "undefined" && console !== null ? console.error(err) : void 0;
      }
    });
    if (window.parent) {
      window.parent.postMessage({
        event: 'startListening'
      }, '*');
      return window.parent.postMessage(JSON.stringify({
        event: 'player:ready'
      }), '*');
    }
  });

}).call(this);
