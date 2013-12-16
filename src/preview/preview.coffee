connect = require 'connect'
watch = require 'watch'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
sdk = require '../../src/sdk'
async = require 'async'
open = require 'open'
Bridge = require '../bridge/bridge'
glob = require 'glob'
jsapi = require 'js-api'

module.exports =
  command: (dirs, options, callback = ->) ->
    defaults =
      port: 3000

    options = _.extend defaults, options

    lookupCourse = dirs.length == 1
    baseDir = if lookupCourse then path.resolve(dirs[0]) else null
    @bridge = options.bridge || new Bridge { baseDir }

    if lookupCourse
      gadgetsPath = "#{baseDir}/versal_data/gadgets"
      if fs.existsSync gadgetsPath then @addGadgets gadgetsPath

      coursePath = "#{baseDir}/versal_data/course.json"
      if fs.existsSync coursePath then @bridge.linkCoursePath coursePath, options

      assetsPath = "#{baseDir}/versal_data/local_assets.json"
      if fs.existsSync assetsPath then @bridge.linkAssets assetsPath

    # Link default course in readonly mode
    unless @bridge.data.courses.length
      course = new jsapi.Course id: 1
      @bridge.linkCourse course

    @previewGadgets dirs, options, callback

  addGadgets: (path) ->
    manifests = glob.sync "#{path}/*/*/*/manifest.json"
    paths = _.map manifests, (m) -> m.replace '/manifest.json', ''
    _.each paths, (path) => @bridge.linkGadget path

  previewCourse: (dir, options) ->

  previewGadgets: (dirs, options, callback) ->
    process.stdout.write "Compiling gadgets..."
    # TODO: handle situation when dir contains already compiled gadget
    # Add gadget from specified directories
    async.map dirs, (dir, cb) =>
      dir = path.resolve dir
      if fs.existsSync path.join dir, 'manifest.json'
        cb null, @bridge.linkGadget dir
      else
        cb null, false

    # run server after gadgets were compiled
    , (err, results) =>
      if(err) then return callback err

      total = results.length
      successful = _.filter(results, (r) -> r).length

      console.log " #{successful} of #{total} done."

      unless options.test
        console.log ''
        console.log " \\ \\/ /  Starting web server on http://localhost:#{options.port}"
        console.log "  \\/ /   Press Ctrl + C to exit..."
        console.log ''

        @bridge.start options
        if options.open then open "http://localhost:#{options.port}"

      callback()
