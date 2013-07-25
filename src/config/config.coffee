fs = require 'fs-extra'
path = require 'path'

module.exports = class Config

	constructor: (options) ->
		versalPath = options.versalPath || "#{@getHomeDirectory()}/.versal"
		@configPath = "#{versalPath}/config.json"

		# create a config if it does not exists
		if fs.existsSync @configPath
			@raw = fs.readJsonSync @configPath
		else
			@raw = require '../../templates/config.json'
			@save()

		# use default environment, unless specified
		@_env = options.env || 'default'

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

  getHomeDirectory: ->
    if process.platform == 'win32'
      process.env.USERPROFILE
    else
      process.env.HOME
