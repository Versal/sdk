_ = require 'underscore'
fs = require 'fs'
url = require 'url'
prompt = require 'prompt'
https = require 'https'
path = require 'path'
needle = require 'needle' #TODO: can we do better and upload it with js-api?
config = require '../../src/config'

module.exports =
  command: (dest, options = {}, callback = ->) ->
    unless dest
      return callback new Error 'destination is required for upload'
    unless options.sessionId
      return callback new Error 'sessionId is required to upload a gadget'

    url = options.apiUrl || config.get 'apiUrl'
    unless url
      return callback new Error 'apiUrl is required to upload a gadget'

    bundlePath = path.resolve "#{dest}/bundle.zip"

    unless fs.existsSync bundlePath
      callback new Error "gadget not found in #{bundlePath}"

    fileData = fs.readFileSync bundlePath
    console.log "Uploading gadget from #{dest}..."

    needle.post "#{url}/gadgets",
      @createRequestData(fileData),
      @createRequestOptions(options.sessionId),
      (err, res, body) ->
        if err then return callback(err)

        # Error code
        if res.statusCode >= 300
          if _.isArray(body)
            messages = _.map(body, (e)-> e.message).join(',')
            return callback new Error "Following errors prevented the gadget from being uploaded: #{messages}"
          else
            return callback new Error "Gadget uploading failed. Error code: #{res.statusCode}"

        # OK code
        if res.statusCode >= 200 && res.statusCode < 300 then return callback()

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
      session_id: sessionId
    timeout: 720000

###
  verifySession: (options, callback) ->
    return callback new Error("Could not verify session") unless options.sessionId

    requestOptions =
      headers:
        session_id: options.sessionId

    needle.get "#{options.url}/user", requestOptions, (err, res, body) ->
      return callback() if res.statusCode == 200
      return callback err if err
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

    console.log "Enter your Versal credentials to sign in:"
    prompt.get promptParams, (err, credentials) ->
      _.extend(options, credentials)

      data = querystring.stringify(credentials)
      requestOptions = 'X-Requested-With': 'XMLHttpRequest'

      needle.post options.authUrl, data, requestOptions, (err, res, body) ->
        return callback err if err
        return callback new Error("Authorization unsuccessful. Error code: " + res.statusCode) if res.statusCode != 200
        sessionId = body.sessionId
        callback null, sessionId

  verifySessionOrAuthenticate: (options, callback) ->
    options.sessionId = options.sessionId || @sessionIdFromConfig options
    @verifySession options, (err) =>
      if err
        @signIn options, (err, sessionId) =>
          unless err then @saveSessionIdToConfig(options, sessionId)
          callback()
      else
        callback null, options.sessionId
###