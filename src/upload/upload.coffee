_ = require 'underscore'
fs = require 'fs'
url = require 'url'
prompt = require 'prompt'
https = require 'https'
sdk = require '../../lib/sdk'
path = require 'path'
needle = require 'needle' #TODO: can we do better and upload it with API?

defaults =
  url: "https://stack.versal.com/api2"
  authUrl: "http://www1.versal.com/signin"

module.exports = 
  command: (dest, options, callback = ->) ->
    options = _.extend defaults, options

    @verifiedSessionId options, (sessionId) =>
      options.sessionId = sessionId
      gadgetBundlePath = path.resolve "#{dest}/bundle.zip"

      unless fs.existsSync gadgetBundlePath
        callback new Error("Gadget bundle not found in #{gadgetBundlePath}. Did you run `versal compress`?") 

      fileData = fs.readFileSync gadgetBundlePath
      console.log "Uploading gadget from #{dest}..."

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

  verifySessionId: (options, callback) ->
    options =
      headers:
        session_id: options.sessionId

    needle.get "#{options.url}/user", options, (err, res, body) ->
      console.log(err)
      if res.statusCode == 200
        callback options.sessionId
      else
        callback()

  obtainSessionId: (options, callback) ->
    querystring = require 'querystring'
    credentials =
      email: options.email
      password: options.password

    prompt = require('prompt')
    promptParams = [
      name: "email", message: "Email address:", required: true
      name: "password", message: "Password at Versal.com:", required: true, hidden: true
    ]

    prompt.message = ""
    prompt.delimiter = ""

    console.log("Enter your Versal credentials to sign in:")
    prompt.get promptParams, (err, credentials) ->
      _.extend(options, credentials)

    data = querystring.stringify(credentials)
    requestOptions = _.extend({}, sdk.configuration.basicAuth);

    needle.post options.authUrl, data, requestOptions, (err, res, body) ->
      return callback err if err
      return callback new Error("Authorization unsuccessful. Error code: " + res.statusCode) if res.statusCode != 200
      sessionId = res.headers["session_id"]
      return callback sessionId

  verifiedSessionId: (options, callback) ->
    @verifySessionId options, (sessionId) =>
      if not sessionId
        @obtainSessionId options, (sessionId) ->
          callback(sessionId)
      else
        callback()
