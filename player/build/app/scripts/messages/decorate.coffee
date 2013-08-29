define [
  'app/mediator'
  'messages/handlers/asset_select'
  'messages/handlers/style_register'
  'messages/handlers/inline_catalogue_show'
  'messages/handlers/parent_notify'
  'messages/handlers/metric_record'
], (mediator, assetSelectHandler, styleRegisterHandler, inlineCatalogueHandler,
  parentNotifyHandler, metricRecordHandler) ->

  # Player-level message handlers belong here
  handlers =
    'asset:select': assetSelectHandler
    'style:register': styleRegisterHandler
    'inlineCatalogue:show': inlineCatalogueHandler
    'parent:notify': parentNotifyHandler
    'metric:record': metricRecordHandler

  # Assign handlers to messages
  _.each handlers, (handler, signal) ->
    mediator.on signal, handler, mediator
