_ = require 'underscore'
fs = require 'fs-extra'
url = require 'url'
prompt = require 'prompt'
https = require 'https'
path = require 'path'
sdk = require '../sdk'
mime = require 'mime'
needle = require 'needle'
async = require 'async'

module.exports =
  command: (paths, options = {}, callback = ->) ->
    unless paths
      return callback new Error 'Please, specify paths for the files you want to upload'
    if _.isString paths then paths = [paths]

    assets = {}
    if options.output
      # Read assets to avoid duplicate uploads
      if fs.existsSync options.output
        assets = fs.readJsonSync options.output
        unless options.force
          existing = _.keys assets
          # Check output for the paths, that are already uploaded
          # TODO: Implement MD5 or content-length comparison
          skipped = _.intersection paths, existing
          if skipped.length
            console.log "Skipped #{skipped.length} files"
            if skipped.length == paths.length then return callback null, {}
            paths = _.difference paths, skipped

    unless options.sessionId
      options.sessionId = sdk.config.get 'sessionId', options

    unless options.apiUrl
      options.apiUrl = sdk.config.get 'apiUrl', options

    async.map paths,
      (filepath, cb) =>
        @uploadFile filepath, options, (err, body) ->
          if err then return cb err
          assets[filepath] = body
          cb null, body
      (err, results) =>
        if err then return callback err
        if options.output then @outputJson options.output, assets
        return callback null, assets

  # The only reason it exists as a stand-alone method is tests
  outputJson: (outputPath, assets) ->
    fs.outputJsonSync outputPath, assets

  uploadFile: (filepath, options = {}, callback = ->) ->
    unless fs.existsSync filepath
      return callback new Error "nothing to upload in #{filepath}"

    # if provided path is a directory, look up for bundle.zip inside
    if fs.statSync(filepath).isDirectory()
      filepath = path.join filepath, 'bundle.zip'
      # bundle should be sent to /gadgets
      unless fs.existsSync filepath
        return callback new Error "bundle.zip not found in #{filepath}"

    filename = path.basename filepath
    unless options.endpoint
      if filename == 'bundle.zip'
        options.endpoint = 'gadgets'
      else
        options.endpoint = 'assets'

    url = "#{options.apiUrl}/#{options.endpoint}"

    # Needle requires that kind of naming for the keys of content object
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

  createRequestOptions: (sessionId) ->
    multipart: true
    headers:
      SESSION_ID: sessionId
    timeout: 720000
