path = require 'path'
fs = require 'fs-extra'
spawn = require('child_process').spawn

# Creates .codio file with versal buttons in current folder
module.exports = (options, callback) ->
  if typeof options == 'function'
    callback = options
    options = {}

  cwd = options?.cwd || process.cwd()
  source = path.join(__dirname, '../templates/.codio')
  target = path.resolve cwd, '.codio'

  fs.copy source, target, (err) ->
    if err then return callback err
    callback()

  # If bower.json is present, run bower install detached.
  bowerPath = path.resolve cwd, 'bower.json'
  fs.exists bowerPath, (exists) ->
    if exists then process.nextTick ->
      # config.interactive is to prevent bower asking for
      # permission to collect statistics anonymously
      child = spawn 'bower',
        ['install', '--config.interactive=false'],
        { detached: true }
      child.unref()
