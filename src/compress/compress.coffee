_ = require 'underscore'
fs = require 'fs-extra'
glob = require 'glob'
path = require 'path'
async = require 'async'
exec = require('child_process').exec

module.exports =
  command: (dest, options, callback = ->) ->
    dest = path.resolve dest
    excludePath = path.resolve "#{__dirname}/../../src/compress/exclude.lst"

    unless fs.existsSync dest
      return callback new Error "directory does not exist: #{dest}"

    # TODO: needs to be tested on windows
    zip = exec "zip -r bundle.zip . -x@#{excludePath}", cwd: dest, (err) ->
      if err
        return callback new Error "zip process exited with code #{err.code}"
      callback()
