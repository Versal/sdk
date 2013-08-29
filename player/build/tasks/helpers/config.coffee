path = require "path"
fs = require 'fs'
_ = require 'lodash'

module.exports = (userConfigPathOrObj, defaultConfigPath) ->
  config = {}
  if defaultConfigPath
    config = require defaultConfigPath

  # If provided override default config with user config
  localConfig = if userConfigPathOrObj
    # If it's a string load it from the fs
    if _.isString userConfigPathOrObj
      localConfigPath = path.resolve userConfigPathOrObj
      if fs.existsSync localConfigPath
        require localConfigPath
    # If it's an obj use it as is
    else
      localConfig
  # If no user config is provided look for one in user home
  else
    localConfigPath = path.join process.env.HOME, '.player.json'
    if fs.existsSync localConfigPath
      require localConfigPath

  _.extend config, localConfig
  config
