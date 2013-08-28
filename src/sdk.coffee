_ = require 'underscore'
async = require 'async'

module.exports = sdk =
  createGadget: -> sdk.execCommand(['create', 'gadget']).apply null, arguments
  createCourse: -> sdk.execCommand(['create', 'course']).apply null, arguments
  docs: -> sdk.execCommand('docs').apply null, arguments
  compile: -> sdk.execCommand('compile').apply null, arguments
  compress: -> sdk.execCommand('compress').apply null, arguments
  upload: -> sdk.execCommand('upload').apply null, arguments
  preview: -> sdk.execCommand('preview', passThrough: true).apply null, arguments
  validate: -> sdk.execCommand('validate').apply null, arguments
  publish: -> sdk.execCommand('publish').apply null, arguments

  config: require('./config')()

  # creates a wrapper over a command, that prepares arguments
  # for the command: converts dirs to array and handles
  # the case, when callback is passed in second argument
  execCommand: (command, cmdOptions = {}) ->
    config = @config

    # if command is a string, look for it in #{command}/#{command}.coffee
    unless _.isArray command
      command = [command, command]

    (dirs, options = {}, callback = ->) ->
      throw new Error 'dirs is required' unless dirs

      # init config for the specified environment
      config.env options.env

      # TODO: add -r flag, that expands directories recursively
      dirs = [dirs] unless _.isArray dirs

      # in case options hash is omitted
      if _.isFunction options
        callback = options
        options = {}

      cmd = require "./#{command.join('/')}"

      if cmdOptions.passThrough
        # simply pass arguments to command
        cmd.command dirs, options, callback
      else
        # otherwise call command async for each dir
        funcs = _.map dirs, (dir) -> (cb) ->
          cmd.command dir, options, cb
        # run all tasks sequentially
        async.series funcs, (err) ->
          callback err