requirejs.config({
  baseUrl: "../",

  paths: {
    text: "sdk/text",
    jquery: "sdk/jquery",
    underscore: "sdk/underscore",
    backbone: "sdk/backbone"
  },

  shim: {
    "jquery": {
      exports: "$"
    },

    "underscore": {
      exports: "_"
    },

    "backbone": {
      deps: ["jquery", "underscore"],
      exports: "Backbone"
    }
  }
});

requirejs(["jquery", "underscore", "backbone", "sdk/player", "text!manifest.json", "gadget"], function($, _, Backbone, Player, manifest, Gadget) {
  //TODO: Remove global objects!
  window.$ = $;
  window.Backbone = Backbone;
  window._ = _;

  manifest = JSON.parse(manifest);
  var defaultConfig = manifest.defaultConfig || {};

  var config = new Backbone.Model(defaultConfig);
  var $el = $("#gadget-container");

  var player = new Player();

  var facade = player.facade;
  facade.config = config;
  facade.propertySheetSchema = new Backbone.Model();
  facade.$el = $el;

  // Remove this when removing the compatibility layer
  facade.properties = config;

  // Change this when removing the compatibility layer
  var gadget = new Gadget(facade, config.toJSON(), $el);

  $('#gadget-container').on('dblclick', function(){ $('#toggle-author-mode').click(); });
  $('#gadget-container').on('click', function(e){ e.stopPropagation(); });

  player.start();
});
