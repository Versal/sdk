_ = require 'underscore'
glob = require 'glob'
path = require 'path'

module.exports =
  command: (dest, options= {}, callback = ->) ->
    dest = path.resolve dest

    files = glob.sync '**/*.*', cwd: dest
    errors = @validateFiles files
    return callback(errors) if errors.length

    manifest = require "#{dest}/manifest.json"
    errors = @validateManifest manifest
    return callback(errors) if errors.length

    #gadget is valid
    callback()

  # validation rules for manifest fields
  manifestFields:
    username:
      required: true
      regex: /^[A-Za-z0-9\-_]{2,}$/
      message: 'manifest.json: username can contain only latin letters, numbers, dashes and underscores'
    name:
      required: true
      regex: /^[A-Za-z0-9-_]{2,}$/
      message: 'manifest.json: name can contain only latin letters, numbers, dashes and underscores'
    version:
      required: true
      regex: /^\d+\.\d+\.\d+$/
      message: 'manifest.json: version must be specified in format: X.X.X, where each X is a number'
    description:
      required: true
    author:
      required: true

  # minimal set of required files for a gadget
  requiredFiles: ["manifest.json", "gadget.js", "gadget.css", "assets/icon.png"]

  validateManifest: (manifest) ->
    errors = []

    missing = _.filter _.keys(@manifestFields), (key) =>
      # select keys that are required and not in manifest.json
      return @manifestFields[key].required && !manifest.hasOwnProperty key

    wrongFormat = _.filter _.keys(@manifestFields), (key) =>
      # select keys from manifest that doesn't match specified regex
      return @manifestFields[key].regex && !@manifestFields[key].regex.test manifest[key]

    # combine all errors into an array
    errors = _.map missing, (key) -> "manifest.json: #{key} is required"
    errors = errors.concat _.map wrongFormat, (key) => @manifestFields[key].message
    return errors

  validateFiles: (files) ->
    missing = _.difference @requiredFiles, files
    return _.map missing, (file) -> return "#{file} not found in the gadget folder"