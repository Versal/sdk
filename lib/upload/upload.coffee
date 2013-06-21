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
  basicAuth:
    username: 'versal'
    password: 'OkeyDokey'

module.exports = 
  command: (dest, options, callback = ->) ->
    options = _.extend defaults, options

    @verifySessionOrAuthenticate options, (err, sessionId) =>
      return callback err if err
      options.sessionId = sessionId
      @saveSessionIdToConfig(options, sessionId)
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

  verifySession: (options, callback) ->
    return callback new Error("Could not verify session") unless options.sessionId

    requestOptions =
      headers:
        session_id: options.sessionId

    needle.get "#{options.url}/user", requestOptions, (err, res, body) ->
      console.log 'verify session 3'
      return callback() if res.statusCode == 200
      console.log 'verify session 4'
      return callback err if err
      console.log 'verify session 5'
      callback new Error("Could not verify session")

  signIn: (options, callback) ->
    querystring = require 'querystring'
    credentials =
      email: options.email
      password: options.password

    prompt = require 'prompt'
    promptParams = [
      {
        name: "email"
        message: "Email address:"
        required: true
      }
      {
        name: "password"
        message: "Password at Versal.com:"
        required: true
        hidden: true
      }
    ]

    prompt.message = ""
    prompt.delimiter = ""

    console.log("Enter your Versal credentials to sign in:")
    prompt.get promptParams, (err, credentials) ->
      _.extend(options, credentials)

      data = querystring.stringify(credentials)
      requestOptions = _.extend({}, options.basicAuth);

      needle.post options.authUrl, data, requestOptions, (err, res, body) ->
        return callback err if err
        return callback new Error("Authorization unsuccessful. Error code: " + res.statusCode) if res.statusCode != 200
        sessionId = res.headers["session_id"]
        callback null, sessionId

  initConfig: ->
    config = { sessionIds: {} }
    fs.writeFileSync @configPath(), JSON.stringify(config)

    config

  readConfig: ->
    if fs.existsSync @configPath()
      rawConfig = fs.readFileSync @configPath(), 'utf-8'
      try
        config = JSON.parse rawConfig
        throw new Error unless config.sessionIds
      catch e
        config = @upgradeConfig()
    else
      config = @initConfig()

    config

  upgradeConfig: (options) ->
    # Upgrade means delete for now
    if fs.existsSync @configPath()
      fs.unlinkSync @configPath()
    @initConfig()

  configPath: ->
    path.join @getHomeDirectory(), '.versal'

  writeConfig: (contents) ->
    fs.writeFileSync @configPath(), JSON.stringify(contents)

  saveSessionIdToConfig: (options, sessionId) ->
    config = @readConfig()
    config.sessionIds[options.url] = sessionId
    @writeConfig config

  sessionIdFromConfig: (options) ->
    config = @readConfig()
    if config.sessionIds
      config.sessionIds[options.url]

  getHomeDirectory: ->
    if process.platform == 'win32'
      process.env.USERPROFILE
    else
      process.env.HOME

  verifySessionOrAuthenticate: (options, callback) ->
    options.sessionId = options.sessionId || @sessionIdFromConfig options
    @verifySession options, (err) =>
      if err
        @signIn options, callback
      else
        callback null, options.sessionId
