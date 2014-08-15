(function() {
  var baseConfig, config, e;

  window.vs || (window.vs = {});

  baseConfig = "{{config}}";

  try {
    baseConfig = JSON.parse(baseConfig);
  } catch (_error) {
    e = _error;
    baseConfig = {};
  }

  require.config(config = {
    waitSeconds: 120,
    baseUrl: 'scripts',
    paths: {
      player: 'player-bundle'
    }
  });

  require(['player'], function(PlayerApplication) {
    window.onunload = (function() {});
    window.addEventListener('message', function(message) {
      var data;
      try {
        data = JSON.parse(message.data);
        if (!data.tracker) {
          data.tracker = baseConfig.tracker;
        }
        if (data.event === 'player:launch') {
          return window.Player = new PlayerApplication(data);
        }
      } catch (_error) {
        e = _error;
      }
    });
    if (window.parent) {
      return window.parent.postMessage(JSON.stringify({
        event: 'player:ready'
      }), '*');
    }
  });

}).call(this);
