_ = require 'underscore'
async = require 'async'

sdk =
  exec: (command, args...) ->
    @[command].apply null, args

  # creates a wrapper over a command, that prepares arguments 
  # for the command: converts dirs to array and handles
  # the case, when callback is passed in second argument
  createCommand: (command, cmdOptions = {}) ->
    (dirs, options, callback = ->) ->
      throw new Error 'dirs is required' unless dirs

      # TODO: add -r flag, that expands directories recursively
      dirs = [dirs] unless _.isArray dirs

      # in case options hash is omitted
      if _.isFunction options
        callback = options
        options = {}

      # TODO: Replace with commands/#{command}
      cmd = require "./#{command}/#{command}"

      if cmdOptions.passThrough
        # simply pass arguments to command
        cmd dirs, options, callback
      else
        # otherwise call command async for each dir
        funcs = _.map dirs, (dir) -> (cb) -> cmd dir, options, cb
        # run all tasks sequentially
        async.series funcs, (err) -> callback err

_.extend sdk,
  create: sdk.createCommand 'create'
  compile: sdk.createCommand 'compile'
  compress: sdk.createCommand 'compress'
  upload: sdk.createCommand 'upload'
  preview: sdk.createCommand 'preview', passThrough: true

module.exports = sdk