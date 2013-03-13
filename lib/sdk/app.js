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

requirejs(["sdk/player", "gadget", "text!manifest.json"], function(Player, Gadget, manifest){ 
  var manifest = JSON.parse(manifest);
  var defaultConfig = manifest.defaultConfig || {};

  var player = new Player();
  var gadget = new Gadget(player.facade, defaultConfig, document.getElementById("gadget-container"));

  player.start();
})