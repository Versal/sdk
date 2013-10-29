_ = require 'underscore'
glob = require 'glob'
ncp = require 'ncp'
path = require 'path'
fs = require 'fs-extra'
async = require 'async'
sdk = require '../sdk'

module.exports = 
  command: (dest, options, callback = ->) ->
    unless dest
      return callback new Error("destination path must be provided")

    dest = path.resolve dest
    defaults =
      template: 'static'
    options = _.extend defaults, options
    unless options.username
      options.username = sdk.config.get 'username'

    # templates are bundled with SDK, unless we want to support custom templates
    template = path.resolve "#{__dirname}/../../templates/#{options.template}"
    unless fs.existsSync template
      return callback new Error "Failed to create gadget: template not found: #{options.template}"

    # rmdirSync will throw an error, if destination folder
    # is not empty. That exactly what we want to prevent running
    # creating over the existing files
    if fs.existsSync dest
      try fs.rmdirSync dest
      catch err
        return callback new Error("directory not empty: #{dest}")

    # creates all missing folders on the path
    fs.mkdirsSync dest
    # async copy all template files to the destination
    ncp template, dest, (err) =>
      if err then return callback(err)
      @updateManifest dest, _.pick(options, 'name', 'version', 'username', 'author', 'title')
      callback()

  updateManifest: (dest, attrs) ->
    manifestPath = "#{dest}/manifest.json"
    manifest = fs.readJsonSync manifestPath
    manifest = _.extend manifest, attrs
    fs.writeJsonSync manifestPath, manifest
