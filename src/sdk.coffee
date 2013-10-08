_ = require 'underscore'
async = require 'async'
path = require 'path'
fs = require 'fs'

module.exports = sdk =
  signin: -> sdk.execCommand('signin').apply null, arguments
  install: -> sdk.execCommand('install').apply null, arguments
  createGadget: -> sdk.execCommand(['create', 'gadget']).apply null, arguments
  createCourse: -> sdk.execCommand(['create', 'course']).apply null, arguments
  docs: -> sdk.execCommand('docs').apply null, arguments
  compile: -> sdk.execCommand('compile').apply null, arguments
  compress: -> sdk.execCommand('compress').apply null, arguments
  upload: -> sdk.execCommand('upload', passThrough: true).apply null, arguments
  preview: -> sdk.execCommand('preview', passThrough: true).apply null, arguments
  validate: -> sdk.execCommand('validate').apply null, arguments
  publish: -> sdk.execCommand('publish').apply null, arguments
  gadgetApprove: -> sdk.execCommand(['gadget','approve']).apply null, arguments
  gadgetReject: -> sdk.execCommand(['gadget','reject']).apply null, arguments

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
        async.map dirs,
          (dir, cb) ->
            cmd.command dir, options, cb
          callback

  # Detect type of the folder by its content
  # /manifest.json - it is a gadget
  # /versal_data/course.json - it is a course
  # otherwise - return null
  detect: (dir) ->
    dir = path.resolve dir
    if fs.existsSync "#{dir}/manifest.json" then return 'gadget'
    if fs.existsSync "#{dir}/versal_data/course.json" then return 'course'
    return null