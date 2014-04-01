(function() {
  var baseConfig, e;

  window.vs || (window.vs = {});

  baseConfig = "{{config}}";

  try {
    baseConfig = JSON.parse(baseConfig);
  } catch (_error) {
    e = _error;
    baseConfig = {};
  }

  require(['lib/config', 'config'], function(cdn_config, player_config) {
    require.config(cdn_config);
    require.config(player_config);
    return require(['cdn.underscore', 'player'], function(_, PlayerApplication) {
      window.onunload = (function() {});
      window.addEventListener('message', function(message) {
        var data;
        try {
          data = _.extend({}, baseConfig, JSON.parse(message.data));
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
  });

}).call(this);
