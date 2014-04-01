prompt = require 'prompt'
querystring = require 'querystring'
needle = require 'needle'
chalk = require 'chalk'

restapi =
  signin: (options, callback) ->
    if !options.authUrl then return callback new Error 'auth url not defined. Check ~/.versal/config.json'
    credentials = { email: options.email, password: options.password }

    needle.post options.authUrl, querystring.stringify(credentials), (err, res, body) ->
      if err then return callback err
      if res.statusCode != 200
        message = body.message || "sign in failed. response code: #{res.statusCode}"
        return callback new Error message

      callback null, body.sessionId

  getUserDetails: (options, callback) ->
    requestOptions =
      headers:
        SID: options.sessionId

    needle.get "#{options.apiUrl}/user", requestOptions, (err, res, body) ->
      if err then return callback err
      if res.statusCode == 200 then return callback null, body

      if body.message
        return callback new Error body.message
      else
        return callback new Error 'SessionID is no longer valid. Run `versal signin`'

module.exports = restapi
