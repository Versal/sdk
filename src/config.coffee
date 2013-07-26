fs = require 'fs-extra'
path = require 'path'

# Migrate old .versal file to
migrate = (versalPath) ->
  oldConfig = fs.readJsonSync versalPath
  fs.removeSync versalPath, versalPath.replace('.versal', 'versal_old')

  if oldConfig.sessionIds
    return oldConfig.sessionIds["https://stack.versal.com/api2"]

homePath = if process.platform == 'win32' then process.env.USERPROFILE else process.env.HOME

module.exports =
  init: (options) ->
    versalPath = options.versalPath || "#{homePath}/.versal"

    # use default environment, unless specified
    @env options.env || 'default'
    @configPath = "#{versalPath}/config.json"

    # create a config if it does not exists
    if fs.existsSync @configPath
      @raw = fs.readJsonSync @configPath
    else
      @raw = require '../templates/config.json'

      # if ~/.versal is a file, than migrate it to the new format
      if fs.existsSync(versalPath) && fs.statSync(versalPath).isFile()
        sessionId = migrate versalPath
        @set 'sessionId', sessionId

      @save()

  env: (env = 'default') ->
    # seitch the environment
    @_env = env

  get: (key, value) ->
    return undefined unless @_env && @raw[@_env]
    @raw[@_env][key]

  set: (key, value) ->
    unless @raw[@_env]
      @raw[@_env] = {}
    @raw[@_env][key] = value
    @save()

  save: ->
    fs.outputJsonSync @configPath, @raw