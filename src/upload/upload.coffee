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
    
    gadgetBundlePath = path.resolve "#{dest}/bundle.zip"

    unless fs.existsSync gadgetBundlePath
      callback new Error("Gadget bundle not found in #{gadgetBundlePath}. Did you run `versal compress`?") 

    fileData = fs.readFileSync gadgetBundlePath
    console.log "Uploading gadget from #{dest}..."

    needle.post "#{options.url}/gadgets",
      @requestData(fileData),
      @requestOptions(options.sessionId), 
      (err, res, body) ->
        # TODO: Check response in Charles and remove this. body should be json
        # body = JSON.parse body.toString 'utf-8'
        if err then return callback err
        
        # OK code
        if res.statusCode >= 200 && res.statusCode < 300
          return callback null, body

        # Error code
        if res.statusCode >= 300
          if _.isArray(body)
            messages = _.map(body, (e)-> e.message).join(',')
            return callback new Error "Following errors prevented the gadget from being uploaded: #{messages}"
          else
            return callback new Error "Gadget uploading failed. Error: #{body.message}"
  
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