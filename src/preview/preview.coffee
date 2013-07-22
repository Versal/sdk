connect = require 'connect'
watch = require 'watch'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
sdk = require '../../src/sdk'
async = require 'async'
open = require 'open'
Bridge = require './bridge'

defaults =
  port: 3000

module.exports =
  command: (dirs, options, callback = ->) ->
    options = _.extend _.clone(defaults), options

    @bridge = options.bridge || new Bridge

    process.stdout.write "Compiling gadgets..."

    # TODO: handle situation when dir contains already compiled gadget
    # Add gadget from specified directories
    async.map dirs, (dir, cb) =>
      dir = path.resolve dir
      sdk.compile dir, options, (err) =>
        if err then return cb(err)
        if fs.existsSync "#{dir}/dist"
          @bridge.addGadget "#{dir}/dist"
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
        @bridge.start options.port
        if options.open then open "http://localhost:#{options.port}"

      @watchGadgets options, dirs, callback

  watchGadgets: (options, dirs, callback) ->
    filtered = (dir, file) ->
      dirPath = path.resolve(dir)
      filePath = path.resolve(file)

      relPath = filePath.substr(dirPath.length + 1)
      pathParts = relPath.split(path.sep)

      fileName = pathParts.pop()
      return true if fileName == 'bundle.zip'

      dirName = pathParts.shift()
      return true if dirName == 'dist'

    gadgetNameFromDir = _.memoize (dir) ->
      manifestPath = path.resolve dir, 'manifest.json'
      require(manifestPath).name

    # TODO: Fix a bug when watch and coffee -cw are being run simultaneously
    watchHandler = (dir) ->
      (file, stat) ->
        return if filtered dir, file
        process.stdout.write "Recompiling #{gadgetNameFromDir(dir)}..."
        sdk.compile dir, options, (err) ->
          if err
            console.log "failed."
          else
            @bridge.updateGadget dir
            console.log "done."

    _.each dirs, (dir) ->
      watchOptions =
        ignoreDotFiles: true

      watch.createMonitor dir, watchOptions, (monitor) ->
        monitor.on "created", watchHandler dir
        monitor.on "changed", watchHandler dir
        monitor.on "removed", watchHandler dir

    callback()
