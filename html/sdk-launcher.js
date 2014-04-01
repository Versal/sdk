(function() {
  window.vs || (window.vs = {});

  require.config({ baseUrl: 'scripts' });

  require(['lib/config', 'config'], function(cdn_config, player_config) {
    require.config(cdn_config);
    require.config(player_config);
    return require(['cdn.underscore', 'player'], function(_, PlayerApplication) {
      window.onunload = (function() {});

      var config = { courseId: 'local', api: { url: 'api', sessionId: '' } };
      return window.Player = new PlayerApplication(config);
    });
  });

}).call(this);
