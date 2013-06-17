_ = require 'underscore'

validate =
  manifestFields:
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

  command: (dirs, options, callback) ->

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

module.exports = validate