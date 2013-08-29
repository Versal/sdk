define ['cdn.underscore', 'cdn.backbone'], (_, Backbone) ->
  class UploadAdapter
    constructor: (api) ->
      @api = api
    
    upload: (file, model, options) ->
      formData = new FormData
      for key, val of model.toJSON()
        if _.isArray(val) || _.isObject(val)
          val = JSON.stringify val
        formData.append key, val
      formData.append 'content', file
      formData.append 'contentType', file.type
      _.extend options,
        data: formData
        cache: false
        contentType: false
        processData: false
      Backbone.sync.apply @, ['create', model, options]
