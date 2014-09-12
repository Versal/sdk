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

    request.get opts, @jsonResponseHandler(callback)

  getGadgetCatalog: (catalog, options, callback) ->
    opts =
      url: options.apiUrl + '/gadgets'
      qs:
        catalog: catalog
        user: 'me'
      headers:
        SID: options.sessionId

    request.get opts, @jsonResponseHandler(callback)

  jsonResponseHandler: (callback) ->
    return (err, res, body) ->
      if err then return callback err

      try
        json = JSON.parse body
      catch err
        message = "Response from '#{opts.url}' could not be parsed as JSON"
        return callback new Error message

      if 200 <= res.statusCode < 300
        return callback null, json
      else if json.message
        return callback new Error json.message
      else
        return callback new Error 'SessionID is no longer valid. Run `versal signin`'

module.exports = restapi
