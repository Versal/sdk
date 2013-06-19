_ = require 'underscore'
fs = require 'fs-extra'
glob = require 'glob'
path = require 'path'
async = require 'async'
spawn = require('child_process').spawn

module.exports = 
  command: (dest, options, callback = ->) ->
    dest = path.resolve dest
    excludePath = path.resolve "#{__dirname}/../../lib/compress/exclude.lst"
    
    unless fs.existsSync dest
      return callback new Error "directory does not exist: #{dest}"

    # TODO: needs to be tested on windows
    zip = spawn 'zip', ['-r', 'bundle.zip', '.', "-x@#{excludePath}"], cwd: dest

    zip.on 'exit', (code) ->
      unless code == 0
        return callback new Error "zip process exited with code #{code}"
      callback()