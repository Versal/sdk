(function() {

  define(['cdn.jquery', 'views/asset_picker/asset_picker'], function($, AssetPickerView) {
    return function(message, options) {
      var callback, mediator, view;
      mediator = this;
      callback = function(assetData) {
        var changed;
        if (!_.isUndefined(assetData)) {
          changed = {};
          if (message.as) {
            changed[message.as] = assetData;
            if (options != null ? options.gadgetId : void 0) {
              mediator.triggerGadgetEvent(options.gadgetId, 'change', changed);
            }
          }
          return typeof message.success === "function" ? message.success(assetData) : void 0;
        }
      };
      view = new AssetPickerView({
        result: callback,
        type: message.type,
        processing: message.processing
      });
      view.render();
      return $('body').append(view.$el);
    };
  });

}).call(this);
