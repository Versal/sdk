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

module.exports = (dest, options, callback = ->) ->
  # in case options hash is omitted
  if _.isFunction options
    callback = options
    options = {}

  # if destination is array, call create for each dir
  if _.isArray dest
    funcs = _.map dest, (dir) -> (cb) -> create dir, options, cb
    # run all tasks sequentially
    async.series funcs, (err) -> callback err
  else
    create dest, options, callback

create = (dest, options, callback = ->) ->
  unless dest
    return callback new Error("destination path must be provided as a string")

  dest = path.resolve dest
  options = _.extend defaults, options

  # templates are bundled with SDK, unless we want to support custom templates
  template = path.resolve "#{__dirname}/../../templates/#{options.template}"
  unless fs.existsSync template
    return callback new Error("template not found: #{options.template}")

  # rmdirSync will throw an error, if destination folder
  # is not empty. That exactly what we want to prevent running
  # creating over the existing files
  if fs.existsSync dest 
    try fs.rmdirSync dest
    catch err
      return callback err

  # creates all missing folders on the path
  fs.mkdirsSync dest

  # async copy all template files to the destination
  ncp template, dest, callback