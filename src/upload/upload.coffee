_ = require 'underscore'
fs = require 'fs'
url = require 'url'
prompt = require 'prompt'
https = require 'https'
path = require 'path'
needle = require 'needle'
sdk = require '../sdk'

module.exports =
  command: (bundlePath, options = {}, callback = ->) ->
    unless bundlePath
      return callback new Error 'provide a path to bundle.zip'

    sessionId = options.sessionId || sdk.config.get 'sessionId', options
    unless sessionId
      return callback new Error 'sessionId is required to upload a gadget'

    url = options.apiUrl || sdk.config.get 'apiUrl', options
    unless url
      return callback new Error 'apiUrl is required to upload a gadget'

    unless fs.existsSync path.resolve bundlePath
      callback new Error "gadget not found in #{bundlePath}"

    unless bundlePath.match /\.zip$/
      bundlePath = path.join bundlePath, '/bundle.zip'

    fileData = fs.readFileSync bundlePath

    needle.post "#{url}/gadgets",
      @createRequestData(fileData),
      @createRequestOptions(sessionId),
      (err, res, body) ->
        # Error sending the request
        if err
          if _.isFunction options.error then options.error err
          return callback err

        # OK code
        if res.statusCode == 201
          if _.isFunction options.success then options.success body
          return callback()

        # Error code
        if res.statusCode >= 300 && !err
          if _.isArray(body)
            messages = _.map(body, (e)-> e.message).join(',')
            err = new Error "Following errors prevented the gadget from being uploaded: #{messages}"
          else
            err = new Error "Gadget uploading failed. Error code: #{res.statusCode}"

        # No status code
        callback new Error 'Upload failed. No status code in response'

  createRequestData: (fileData) ->
    content:
      buffer: fileData
      filename: 'bundle.zip'
      content_type: 'application/zip'

  createRequestOptions: (sessionId) ->
    multipart: true
    headers:
      SESSION_ID: sessionId
    timeout: 720000