_ = require 'underscore'
fs = require 'fs-extra'
HOME = if process.platform == 'win32' then process.env.USERPROFILE else process.env.HOME

config = (options) ->
  home = options?.home || HOME
  throw new Error "Home directory does not exists at #{home}" unless fs.existsSync home

  base = "#{home}/.versal"
  # if ~/.versal is a file then migrate it to the new format
  # TODO: Remove this in October, 2013
  if fs.existsSync(base) && fs.statSync(base).isFile()
    sessionId = migrate base
    config = new Config { base }
    if sessionId
      config.set { sessionId }, env: 'default'
      config.set { sessionId }, env: 'stage'
    return config

  return new Config { base }

# Move away old .versal file and store SessionId for convenience
# TODO: Remove this in October, 2013
migrate = (versalPath) ->
  oldConfig = fs.readJsonSync versalPath
  fs.renameSync versalPath, versalPath.replace('.versal', 'versal_old')
  if oldConfig.sessionIds
    return oldConfig.sessionIds["https://stack.versal.com/api2"]

class Config
  _env: 'default'

  constructor: (options) ->
    @configPath = "#{options.base}/config.json"

    # create a config if it does not exists
    if fs.existsSync @configPath
      @_data = fs.readJsonSync @configPath
    else
      @_data = require '../templates/config.json'
      @save()

  # switch the environment
  env: (env) ->
    @_env = env || 'default'

  # returns a given key in current environment (@_env)
  # you can explicitly specify environment in options.env
  get: (key, options) ->
    env = options?.env || @_env
    if env && @_data[env] then return @_data[env][key]

  set: (key, value, options) ->
    patch = {}

    if _.isString key
      patch[key] = value
    else
      patch = key
      options = value

    env = options?.env || @_env
    @_data[env] = _.extend (@_data[env] || {}), patch
    @save()

  save: ->
    # outputJson will create missing .versal folder
    fs.outputJson @configPath, @_data

module.exports = config