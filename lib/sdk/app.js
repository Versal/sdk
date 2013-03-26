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

requirejs(["jquery", "underscore", "backbone", "sdk/player", "text!manifest.json", "gadget"], function($, _, Backbone, Player, manifest, Gadget){ 
  //TODO: Remove global objects!
  window.$ = $;
  window.Backbone = Backbone;
  window._ = _;

  var manifest = JSON.parse(manifest);
  var defaultConfig = manifest.defaultConfig || {};

  var player = new Player();
  var gadget = new Gadget(player.facade, defaultConfig, $("#gadget-container"));

  $('#gadget-container').on('dblclick', function(){ player.facade.trigger('toggleEdit', true); });

  player.start();
})