_ = require 'underscore'
glob = require 'glob'
ncp = require 'ncp'
path = require 'path'
fs = require 'fs-extra'
async = require 'async'

# Creates gadget from the template.
# Uses 'static' template by default.
defaults =
  template: 'static'

module.exports =
  command: (dest, options, callback = ->) ->
    unless dest
      return callback new Error("destination path must be provided")

    dest = path.resolve dest
    options = _.extend defaults, options

    # templates are bundled with SDK, unless we want to support custom templates
    template = path.resolve "#{__dirname}/../../templates/#{options.template}"
    unless fs.existsSync template
      throw new Error("template not found: #{options.template}")

    # rmdirSync will throw an error, if destination folder
    # is not empty. That exactly what we want to prevent running
    # creating over the existing files
    if fs.existsSync dest
      try fs.rmdirSync dest
      catch err
        throw new Error("directory not empty: #{dest}")

    # creates all missing folders on the path
    fs.mkdirsSync dest
    # async copy all template files to the destination
    ncp template, dest, (err) ->
      if err then return callback(err)
      callback()