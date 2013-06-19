connect = require 'connect'
watch = require 'watch'
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

    process.stdout.write "Compiling gadgets..."
    
    # TODO: handle situation when dir contains already compiled gadget
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
    # run server after gadgets were compiled
    , (err, results) =>
      if(err) then return callback err

      total = results.length
      successful = _.filter(results, (r) -> r).length

      console.log " #{successful} of #{total} done."

      unless options.test
        options.bridge.app.listen options.port
        
        console.log ''
        console.log " \\ \\/ /  Starting web server on #{options.bridge.url}"
        console.log "  \\/ /   Press Ctrl + C to exit..."
        console.log ''

      @watchGadgets options, dirs, callback

  watchGadgets: (options, dirs, callback) ->
    filtered = (dir, file) ->
      relPath = file.substr(dir.length + 1)
      pathParts = relPath.split(path.sep)

      fileName = pathParts.pop()
      return true if fileName == 'bundle.zip'

      dirName = pathParts.shift()
      return true if dirName == 'dist'

    watchHandler = (dir) ->
      (file, stat) ->
        return if filtered dir, file
        process.stdout.write "Recompiling (#{dir})... "
        sdk.compile dir, options, (err) ->
          if err
            console.log "failed."
          else
            console.log "done."

    _.each dirs, (dir) ->
      watchOptions =
        ignoreDotFiles: true

      watch.createMonitor dir, watchOptions, (monitor) ->
        monitor.on "created", watchHandler dir
        monitor.on "changed", watchHandler dir
        monitor.on "removed", watchHandler dir

    callback()
