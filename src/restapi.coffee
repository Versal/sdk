prompt = require 'prompt'
qs = require 'querystring'
request = require 'request'
_ = require 'underscore'
chalk = require 'chalk'

restapi =
  signin: (options, callback) ->
    if !options.authUrl then return callback new Error 'auth url not defined. Check ~/.versal/config.json'

    opts =
      url: options.authUrl
      json: _.pick options, 'email', 'password'

    request.post opts, (err, res, body) ->
      if err then return callback err
      if res.statusCode != 200
        message = body.message || "sign in failed. response code: #{res.statusCode}"
        return callback new Error message

      callback null, body.sessionId

  getUserDetails: (options, callback) ->
    opts =
      url: "#{options.apiUrl}/user"
      headers:
        SID: options.sessionId

    request.get opts, (err, res, body) ->
      if err then return callback err
      if res.statusCode == 200 then return callback null, body

      if body.message
        return callback new Error body.message
      else
        return callback new Error 'SessionID is no longer valid. Run `versal signin`'

module.exports = restapi
