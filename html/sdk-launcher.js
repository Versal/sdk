(function() {
  window.vs || (window.vs = {});

  // Polyfill window.location.origin for the inferior browser
  // See: http://tosbourn.com/a-fix-for-window-location-origin-in-internet-explorer/
  if (!window.location.origin) {
    var loc = window.location;
    var port = '';
    if (loc.port) {
      port = ':' + loc.port;
    }
    window.location.origin = loc.protocol + '//' + loc.hostname + port;
  }

  window.addEventListener('message', function(evt){
    if(typeof evt == 'object') {
      var message = evt.data;
      if(message && message.event) {
        console.log('SDK received message from gadget:', message.event, message.data);
      }
    }
  });

  require.config({ baseUrl: 'scripts' });

  require(['lib/config', 'config'], function(cdn_config, player_config) {
    require.config(cdn_config);
    require.config(player_config);
    return require(['cdn.underscore', 'player'], function(_, PlayerApplication) {
      var noEditable = !!window.location.search.match(/learn=true/);
      var config = {
        playerUrl: window.location.origin,
        courseId: 'local',
        api: { url: 'api', sessionId: '' },
        noEditable: noEditable
      };
      return window.Player = new PlayerApplication(config);
    });
  });

}).call(this);
