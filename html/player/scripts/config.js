(function() {
  var config;

  config = {
    waitSeconds: 120,
    baseUrl: 'scripts',
    paths: {
      player: 'player-bundle'
    },
    shim: {
      'plugins/vs.ui': {
        deps: ['cdn.backbone'],
        exports: 'vs.ui'
      },
      'plugins/vs.api': {
        deps: ['cdn.jquery', 'cdn.underscore', 'cdn.backbone'],
        exports: 'vs.api'
      },
      'plugins/vs.collab': {
        deps: ['cdn.backbone']
      },
      'libs/backbone.filter': {
        deps: ['cdn.backbone']
      },
      'plugins/backbone.prioritize': {
        deps: ['cdn.backbone']
      },
      player: {
        deps: ['cdn.marionette', 'plugins/vs.api', 'plugins/vs.ui']
      }
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = config;
  }

  if (typeof define !== 'undefined') {
    define([], function() {
      return config;
    });
  }

}).call(this);
