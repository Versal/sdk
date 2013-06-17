connect = require 'connect'
open = require 'open'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
sdk = require '../../lib/sdk'
async = require 'async'
Bridge = require './bridge'

defaults = 
  port: 3000

module.exports = 
  command: (dirs, options, callback = ->) ->
    options = _.extend defaults, options

    unless options.bridge
      options.bridge = new Bridge port: options.port

    console.log "compiling gadgets..."
    
    # Add gadget from specified directories
    async.map dirs, (dir, cb) ->
      dir = path.resolve dir
      sdk.compile dir, options, (err) ->
        if err then return cb(err)
        if fs.existsSync "#{dir}/dist"
          options.bridge.addGadget "#{dir}/dist"
          cb null, true
        else 
          cb null, false

    , (err, results) ->
      total = results.length
      successful = _.filter(results, (r) -> r).length

      console.log "#{successful} of #{total} gadgets compiled successfully"

      unless options.test
        options.bridge.app.listen options.port
        
        console.log ''
        console.log " \\ \\/ /  Starting web server on #{options.bridge.url}"
        console.log "  \\/ /   Press Ctrl + C to exit..."

      callback()