_ = require 'underscore'
fs = require 'fs'
sdk = require '../../lib/sdk'
path = require 'path'
needle = require 'needle' #TODO: can we do better and upload it with API?

defaults =
  url: "https://stack.versal.com/api2"

module.exports = 
  command: (dest, options, callback = ->) ->
    options = _.extend defaults, options
    throw new Error 'sessionId is required' unless options.sessionId
    
    bundlePath = path.resolve "#{dest}/bundle.zip"
    if fs.existsSync bundlePath
      # if bundle.zip exists in the specified location,
      # upload it to the api
      @upload bundlePath, options, callback
    else
      # if bundle.zip is not found in specified location,
      # validate if this folder is a gadget at all and compress it.
      sdk.validate bundlePath, (err) ->
        if err then return callback new Error("bundle.zip not found in #{bundlePath}. Is this a valid gadget folder?") 
        sdk.compress bundlePath, (err) ->
          if err then return callback(err)
          @upload bundlePath, options, callback
    

  upload: (bundlePath, options, callback) ->
    console.log "Uploading gadget from #{dest}..."
    fileData = fs.readFileSync bundlePath
    needle.post "#{options.url}/gadgets",
      @requestData(fileData),
      @requestOptions(options.sessionId), 
      (err, res, errors) ->
        if err then return callback(err)
        # OK code
        if res.statusCode >= 200 && res.statusCode < 300 then return callback()
        # Error code
        if res.statusCode >= 300
          if _.isArray(errors)
            messages = _.map(errors, (e)-> e.message).join(',')
            return callback new Error "Following errors prevented the gadget from being uploaded: #{messages}"
          else
            return callback new Error "Gadget uploading failed. Error code: #{res.statusCode}"
  
  requestData: (fileData) ->
    content: 
      buffer: fileData
      filename: 'bundle.zip'
      content_type: 'application/zip'
    
  requestOptions: (sessionId) ->
    multipart: true
    headers: 
      session_id: sessionId
    timeout: 60000