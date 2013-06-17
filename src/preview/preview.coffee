connect = require 'connect'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
Bridge = require './bridge'

defaults = 
  port: 3000

module.exports = 
  command: (dirs, options, callback = ->) ->
    options = _.extend defaults, options
    
    unless options.bridge
      options.bridge = new Bridge port: options.port

    # Add gadget from specified directories
    _.forEach dirs, (dir) ->
      dir = path.resolve dir
      if fs.existsSync "#{dir}/dist"
        # TODO maybe compile uncompiled gadgets?
        # then we need to check for something like "is folder a gadget?"
        options.bridge.addGadget "#{dir}/dist" 

    unless options.test
      options.bridge.app.listen options.port
      
      console.log ''
      console.log " \\ \\/ /  Starting web server on #{options.bridge.url}"
      console.log "  \\/ /   Press Ctrl + C to exit..."

    callback()