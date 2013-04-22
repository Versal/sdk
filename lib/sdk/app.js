requirejs.config({
  baseUrl: "../",

  paths: {
    text: "sdk/text",
  }
});

require(['sdk/shared-libs/config'], function(registerCdn){ registerCdn('sdk/shared-libs'); });

requirejs(["sdk/player", "text!manifest.json", "gadget"], function(Player, manifest, Gadget){ 
  var manifest = JSON.parse(manifest);
  var defaultConfig = manifest.defaultConfig || {};

  var player = new Player();
  var gadget = new Gadget(player.facade, defaultConfig, $("#gadget-container"));

  $('#gadget-container').on('dblclick', function(){ $('#toggle-author-mode').click() });
  $('#gadget-container').on('click', function(e){ e.stopPropagation(); });

  player.start();
})
