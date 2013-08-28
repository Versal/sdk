define [
  'cdn.jquery'
  'views/asset_picker/asset_picker'
], ($, AssetPickerView) ->

  # Handler for "asset:select" messages
  #
  # `message`:
  #   -Don't use this, should be deprecated: * `as`: the field to place asset json in callback argument
  #   * `type`: the type of assets to use ('image'|'video')
  #   * `[files]`: a FileList http://www.w3.org/TR/FileAPI/#dfn-filelist
  #   * `[url]`: a url to an asset to download
  #
  # `options`:
  #   * `gadgetId`: the ID of the gadget that originated the request
  #
  (message, options) ->

    mediator = @

    # Handle an asset
    callback = (assetData) ->
      unless _.isUndefined assetData
        changed = {}
        if message.as
          changed[message.as] = assetData
          if options?.gadgetId
            mediator.triggerGadgetEvent options.gadgetId, 'change', changed

        message.success? assetData

    # Show asset picker
    view = new AssetPickerView result: callback, type: message.type, processing: message.processing
    view.render()

    $('body').append view.$el

