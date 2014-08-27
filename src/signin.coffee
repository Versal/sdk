request = require 'request'
prompt = require 'prompt'
_ = require 'underscore'
chalk = require 'chalk'
config = require('./config')()

module.exports =
  addSessionToArgv: (oldArgv, callback) ->
    argv = _.clone(oldArgv)
    argv.apiUrl ?= config.get 'apiUrl'
    argv.sessionId ?= argv.sid || config.get 'sessionId'

    if !argv.apiUrl then return callback new Error 'apiUrl not defined. Check ~/.versal/sdk/default.json'

    if !argv.sessionId
      module.exports.simpleSignin argv, (err, sessionId) ->
        if err then return callback err

        argv.sessionId = sessionId
        callback null, argv
    else
      callback null, argv

  simpleSignin: (argv, callback) ->
    authUrl = argv.authUrl || config.get 'authUrl'
    if !authUrl then return callback new Error 'authUrl not defined. Check ~/.versal/sdk/default.json'

    console.log "Signing in to #{authUrl}"
    promptCredentials argv, (err, credentials) ->
      opts =
        url: authUrl
        json: credentials

      request.post opts, (err, res, body) ->
        if err then return callback err
        if res.statusCode != 200
          message = body.message || "sign in failed. response code: #{res.statusCode}"
          return callback new Error message

        config.set 'sessionId', body.sessionId
        if argv.verbose || argv.v then console.log body.sessionId
        console.log chalk.green 'You have signed in successfully'

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
