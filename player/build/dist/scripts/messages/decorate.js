(function() {

  define(['app/mediator', 'messages/handlers/asset_select', 'messages/handlers/style_register', 'messages/handlers/inline_catalogue_show', 'messages/handlers/parent_notify', 'messages/handlers/metric_record'], function(mediator, assetSelectHandler, styleRegisterHandler, inlineCatalogueHandler, parentNotifyHandler, metricRecordHandler) {
    var handlers;
    handlers = {
      'asset:select': assetSelectHandler,
      'style:register': styleRegisterHandler,
      'inlineCatalogue:show': inlineCatalogueHandler,
      'parent:notify': parentNotifyHandler,
      'metric:record': metricRecordHandler
    };
    return _.each(handlers, function(handler, signal) {
      return mediator.on(signal, handler, mediator);
    });
  });

}).call(this);
