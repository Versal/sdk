path = require 'path'
fs = require 'fs-extra'

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
