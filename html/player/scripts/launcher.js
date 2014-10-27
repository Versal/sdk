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
    return window.parent.postMessage({
      event: 'startListening'
    }, '*');
  });

}).call(this);
