querystring = require 'querystring'
needle = require 'needle'
config = require '../config'
prompt = require 'prompt'

module.exports = signin =
  # TODO: dirs look unnatural here
  command: (dirs, options, callback = ->) ->
    @signin options, (err, sessionId) =>
      if err then return callback err

      config.set 'sessionId', sessionId
      @getUserDetails sessionId: sessionId, (err, user = {}) ->
        if err then return callback err
        unless user.username
          return callback new Error 'unable to determine username by session id. Try signing in again.'

        config.set 'username', user.username
        callback()

  signin: (options, callback) ->
    authUrl = options.authUrl || config.get('authUrl')

    unless authUrl
      throw new Error 'authUrl is not found in config'

    @promptCredentials options, (err, credentials) ->
      data = querystring.stringify(credentials)
      requestOptions = 'X-Requested-With': 'XMLHttpRequest'

      needle.post authUrl, data, requestOptions, (err, res, body) ->
        if err then return callback err
        if res.statusCode != 200
          if body.message
            return callback new Error body.message
          else
            return callback new Error "sign in failed. response code: #{res.statusCode}"

        callback null, body.sessionId

  promptCredentials: (options, callback) ->
    if options.email && options.password
      return callback null, email: options.email, password: options.password

    prompt.message = ''
    prompt.delimiter = ''

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

    console.log "Enter your Versal credentials to sign in:"
    prompt.get promptParams, (err, credentials) ->
      callback null, credentials

  getUserDetails: (options, callback) ->
    apiUrl = options.apiUrl || config.get 'apiUrl'
    requestOptions =
      headers:
        session_id: options.sessionId

    needle.get "#{apiUrl}/user", requestOptions, (err, res, body) ->
      if err then return callback err
      if res.statusCode == 200 then return callback null, body

      if body.message
        return callback new Error body.message
      else
        return callback new Error 'session id is no longer valid'

###
  .--.
                    /.-. '----------.
                    \'-' .--"--""-"-'
                 jgs '--'
                 ###