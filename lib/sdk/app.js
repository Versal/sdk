requirejs.config({
  baseUrl: "../",

  paths: {
    text: "sdk/text",
  }
});

require(['sdk/shared-libs/config'], function(registerCdn){ registerCdn('sdk/shared-libs'); });

requirejs(["sdk/player", "text!manifest.json", "gadget", "text!sdk/fake_assets.json"], function(Player, manifest, Gadget, assets){ 
  var manifest = JSON.parse(manifest);
  var defaultConfig = manifest.defaultConfig || {};

  var config = new Backbone.Model(defaultConfig);
  var $el = $("#gadget-container");

  var player = new Player();

  var options = player.facade;
  // TODO: When removing compatibility layer, use:
  // var options = {};

  options.player = player.facade;
  options.el = $el[0];
  options.config = config;
  options.userState = new Backbone.Model();

  // Convenient attribute for when using Backbone.View (particularly when using Marionette)
  options.model = config;

  // TODO: Use PropertySheetSchema from API when enabling property sheets in the SDK
  options.propertySheetSchema = new Backbone.Model();

  // TODO: Remove these when removing the compatibility layer
  options.facade = player.facade;
  options.properties = config;
  options.$el = $el;

  // TODO: Change this when removing the compatibility layer
  var gadget = new Gadget(options, config.toJSON(), $el);

  $('#gadget-container').on('dblclick', function(){ $('#toggle-author-mode').click(); });
  $('#gadget-container').on('click', function(e){ e.stopPropagation(); });

  // Some monkey business to fake our asset picking API. TODO: don't do it

  var assets = JSON.parse(assets);
  var assetIndexes = {image: -1, video: -1};

  var nextAsset = function(assetType) {
    assetIndexes[assetType]++;
    if (assetIndexes[assetType] >= assets[assetType].length) {
      assetIndexes[assetType] = 0;
    }
    return assets[assetType][assetIndexes[assetType]];
  };

  var fakeAssetReady = function(assetReq) {
    var asset = nextAsset(assetReq.type);

    defaultConfig[assetReq.as] = asset;
    player.facade.trigger('configChange', defaultConfig);
  };

  player.facade.on('asset:select', fakeAssetReady);

  player.start();
});
