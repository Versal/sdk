prompt = require 'prompt'
qs = require 'querystring'
request = require 'request'
_ = require 'underscore'
chalk = require 'chalk'

restapi =
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
