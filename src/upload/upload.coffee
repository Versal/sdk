fs = require 'fs'
sdk = require '../../lib/sdk2'
api = require 'js-api'
path = require 'path'

module.exports = (dest, options = {}, callback = ->) ->
  throw new Error 'sessionId is required' unless options.sessionId
  
  api.init
    sessionId: options.sessionId
    sessionIdKey: 'SID'
    apiUrl: 'http://localhost:8082'

  gadgetBundlePath = path.resolve "#{dest}/bundle.zip"

  unless fs.existsSync gadgetBundlePath
    callback new Error("Gadget bundle not found in #{gadgetBundlePath}. Did you run `versal compress`?") 

  console.log "Uploading gadget from #{dest}..."
  
  gadget = new api.GadgetProject
  gadget.save content: fs.readFileSync(gadgetBundlePath),
    upload: true
    success: (model) -> 
      console.log 'Gadget uploaded successfully'
      callback()
    error: (err) ->
      console.log 'bad'
      callback(err)
