(function() {
  window.vs || (window.vs = {});

  window.addEventListener('message', function(evt){
    if(typeof evt == 'object') {
      var message = evt.data;
      if(message.event) {
        console.log('SDK received message from gadget:', message.event, message.data);
      }
    }
  });

  require(['scripts/lib/config', 'scripts/config'], function(cdn_config, player_config) {
    require.config(cdn_config);
    require.config(player_config);
    return require(['cdn.underscore', 'player'], function(_, PlayerApplication) {
      var noEditable = !!window.location.search.match(/learn=true/);
      var config = {
        courseId: 'local',
        api: { url: 'api', sessionId: '' },
        noEditable: noEditable
      };
      return window.Player = new PlayerApplication(config);
    });
  });

}).call(this);
