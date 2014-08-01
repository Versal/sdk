request = require 'request'
prompt = require 'prompt'

module.exports = (options, callback) ->
  if !options.authUrl then return callback new Error 'auth url not defined. Check ~/.versal/sdk/default.json'

  promptCredentials options, (err, credentials) ->
    opts =
      url: options.authUrl
      json: credentials

    request.post opts, (err, res, body) ->
      if err then return callback err
      if res.statusCode != 200
        message = body.message || "sign in failed. response code: #{res.statusCode}"
        return callback new Error message

      callback null, body.sessionId

promptCredentials = (options, callback) ->
  if options.email && options.password
    return callback null, options

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
      message: "Password:"
      required: true
      hidden: true
    }
  ]

  console.log 'Enter your Versal.com credentials to sign in:'
  prompt.get promptParams, callback
