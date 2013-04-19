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

  var options = player.facade;
  // TODO: When removing compatibility layer, use:
  // var options = {};

  options.facade = player.facade;
  options.el = $el[0];
  options.config = config;

  // Convenient attribute for when using Backbone.View (particularly when using Marionette)
  options.model = config;

  // TODO: Use PropertySheetSchema from API when enabling property sheets in the SDK
  options.propertySheetSchema = new Backbone.Model();

  // TODO: Remove these when removing the compatibility layer
  options.properties = config;
  options.$el = $el;

  // TODO: Change this when removing the compatibility layer
  var gadget = new Gadget(options, config.toJSON(), $el);

  $('#gadget-container').on('dblclick', function(){ $('#toggle-author-mode').click(); });
  $('#gadget-container').on('click', function(e){ e.stopPropagation(); });

  player.start();
});
