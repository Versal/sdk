_ = require 'underscore'
fs = require 'fs-extra'
url = require 'url'
prompt = require 'prompt'
https = require 'https'
path = require 'path'
sdk = require '../sdk'
mime = require 'mime'
needle = require 'needle'

module.exports =
  command: (filepath, options = {}, callback = ->) ->
    unless filepath
      return callback new Error 'filepath argument is required'

    unless fs.existsSync filepath
      return callback new Error "nothing to upload in #{path.resolve filepath}"

    # if provided path is directory, look up for bundle.zip inside
    if fs.statSync(filepath).isDirectory()
      filepath = path.join filepath, 'bundle.zip'
      unless fs.existsSync filepath
        return callback new Error "bundle.zip not found in #{filepath}"

    unless options.sessionId
      options.sessionId = sdk.config.get 'sessionId', options

    unless options.apiUrl
      options.apiUrl = sdk.config.get 'apiUrl', options

    unless options.endpoint
      options.endpoint = if filepath.match /bundle\.zip$/ then 'gadgets' else 'assets'

    if options.output
      cb = callback
      callback = (err, body) =>
        unless err
          @outputJson options.output, filepath, body
        cb err, body

    @uploadFile filepath, options, callback

  uploadFile: (filepath, options = {}, callback = ->) ->
    unless options.sessionId
      return callback new Error 'sessionId is required to upload a gadget'
    unless options.apiUrl
      return callback new Error 'apiUrl is required to upload a gadget'
    unless fs.existsSync filepath
      return callback new Error "nothing to upload in #{filepath}"

    url = "#{options.apiUrl}/#{options.endpoint}"

    # Needle requires that kind of naming for the keys of content object
    filename = path.basename filepath
    content_type = mime.lookup filename
    buffer = fs.readFileSync filepath

    # This is not the best idea, to read file sync into buffer, but thats how
    # REST API works now. (https://github.com/Versal/rest-api/issues/494)
    requestData =
      content: { filename, buffer, content_type }
      contentType: content_type

    # In case we are uploading an asset, set "title" and "tags"
    if options.endpoint == 'assets'
      requestData.title = options.title || filename
      requestData.tags = JSON.stringify(options.tags || [])

    # TODO: I want superagent instead of needle once platform supports that.
    needle.post url,
      requestData,
      @createRequestOptions(options.sessionId),
      (err, res, body) ->
        # Error code
        if !err && res.statusCode >= 300 then err = new Error body.message

        # Error sending the request
        if err
          if _.isFunction options.error then options.error err
          return callback err

        # OK code
        if res.statusCode == 201
          if options.verbose then console.log body
          if _.isFunction options.success then options.success body
          return callback null, body

  outputJson: (outputPath, filepath, body) ->
    assets = {}
    if fs.existsSync outputPath
      assets = fs.readJsonSync outputPath
    assets[filepath] = body
    fs.outputJsonSync outputPath, assets

  createRequestOptions: (sessionId) ->
    multipart: true
    headers:
      SESSION_ID: sessionId
    timeout: 720000