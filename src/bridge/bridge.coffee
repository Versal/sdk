express = require 'express'
path = require 'path'
fs = require 'fs-extra'
_ = require 'underscore'
glob = require 'glob'
shortid = require 'shortid'
middleware = require '../../player/build/dev_middleware'
jsapi = require 'js-api'

playerRoot = path.join __dirname, '../../player/build/app'
sdkSite = path.join __dirname, '../../player/build/dist'
nodeModules = path.join __dirname, '../../node_modules'
sdkFixtures = path.join __dirname, '../../player/fixtures'
pkg = require '../../package.json'

module.exports = class Bridge
  assets: {}
  gadgets: []
  course: {}
  users: []
  sessions: []
  progress: {}

  constructor: ->
    @site = express()
    @api = express()

    @setupAPI(@api)

    @site.use (req, res, next) ->
      res.header 'Access-Control-Allow-Origin', '*'
      res.header 'Access-Control-Allow-Headers', 'X-Requested-With, SESSION_ID, SID, Content-Type'
      res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
      next()
    @site.options '*', (req, res) -> res.end()

    @site.use middleware.cssRewriter playerRoot
    @site.use express.static sdkSite
    @site.use express.static nodeModules
    @site.use '/api', @api

    @linkCourse "#{sdkFixtures}/course.json"

  setupAPI: (api) ->
    api.use express.bodyParser()

    # send 200 for /version to indicate it is bridge
    api.get '/version', (req, res) ->
      res.type 'html'
      res.send 200, "bridge-#{pkg.version}"

    api.get '/courses/:course_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        res.send 404 unless course
        res.send _.extend course, isEditable: true

    api.get '/courses/:course_id/lessons', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        res.send course.lessons

    api.get '/courses/:course_id/lessons/:lesson_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        lesson_id = req.params['lesson_id']
        lesson = _.find course.lessons, (lesson) -> lesson.id.toString() == lesson_id
        res.send lesson

    # Progress
    # GET - return nothing
    api.get '/courses/:id/progress', (req, res) -> res.send {}

    api.get '/gadgets', (req, res) =>
      if req.param('catalog') == 'sandbox'
        res.send @gadgets
      else
        res.send []

    api.post '/gadgets', (req, res) =>
      if manifest = @addGadget req.param('path')
        res.send 201, manifest
      else
        res.send 400

    api.post '/assets', @uploadAsset
    # get representation
    api.get '/assets/:id/:repId', (req, res) =>
      id = req.param 'id'
      repId = req.param 'repId'
      res.sendfile @assets[id].representations[repId]._filePath

    # get manifest
    api.get '/assets/:id', (req, res) =>
      id = req.param 'id'
      res.send @assets[id]

    # Serve the asset fixtures
    api.use express.static sdkFixtures

    # POST, PUT and DELETE various stuff
    # Do nothing
    api.put '/courses/:id/progress', (req, res) -> res.send {}

    api.post '/courses/:id/lessons', (req, res) -> res.send 201, {}
    api.put '/courses/:id/lessons/:lesson_id', (req, res) -> res.send {}
    api.delete '/courses/:id/lessons/:lesson_id', (req, res) -> res.send {}

    api.post '/courses/:id/lessons/:lesson_id/gadgets', (req, res) -> res.send 201, {}
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', (req, res) -> res.send {}
    api.delete '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', (req, res) -> res.send {}
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/config', (req, res) -> res.send {}
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/userstate', (req, res) -> res.send {}
    api.get '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/userstate', (req, res) -> res.send {}

    api.post '/users', (req, res) =>
      user = new jsapi.User _.extend req.body, id: _.uniqueId()
      @users.push user
      res.send 201, user.attributes

    api.post '/signin/:id', (req, res) =>
      user = _.find @users, (u) -> u.id == req.param('id')
      if user?.id
        session =
          id: _.uniqueId('session_')
          userId: user.id
        @sessions.push session
        res.send 201, { sessionId: session.id }
      else
        res.send 401

  start: (@port) ->
    @site.use @indexMiddleware()
    @server = @site.listen @port

    console.log ''
    console.log " \\ \\/ /  Starting web server on http://localhost:#{@port}"
    console.log "  \\/ /   Press Ctrl + C to exit..."
    console.log ''

  stop: ->
    if @server then @server.close()

  linkCourse: (coursePath) ->
    return unless fs.existsSync coursePath
    @course = fs.readJsonSync coursePath

  # Suport only single course for now
  # FIXME: return the appropriate course
  # based on id, whenever needed
  findCourse: (id, callback) ->
    callback @course

  indexMiddleware: ->
    templatePath = path.join playerRoot, 'index.html.tmpl'
    configPath = path.join __dirname, '../../player.json'
    config = require configPath
    config.apiUrl = "http://localhost:#{@port}/api"

    middleware.serveIndex templatePath, config

  addGadget: (gadgetPath) ->
    id = shortid.generate()
    manifest = @prepareManifest gadgetPath, id
    return unless manifest

    gadget = new jsapi.GadgetProject manifest
    @gadgets.push gadget

    # Redirect all requests to gadgets/:id to gadget folder
    @api.use gadget.path(), express.static gadgetPath
    @api.get gadget.manifest(), (req, res) -> res.send manifest
    @api.get gadget.code(), (req, res) -> res.send 200
    @api.get gadget.compiled(), (req, res) -> res.send 200

    # Legacy stuff - remove on October 2013
    @site.use "/api/gadgets/#{manifest.id}", express.static gadgetPath

    return manifest

  uploadAsset: (req, res) =>
    id = shortid.generate()
    assetPath = req.files['content'].path
    asset =
      id: id
      representations: [{ location: "/assets/#{id}/0", _filePath: assetPath }]
    @assets[id] = asset
    res.send 201, asset

  # Below is all legacy stuff. Remove, once player is updated
  # and all gadgets are recompiled
  # TODO: Remove on October, 2013
  prepareManifest: (gadgetPath, id) ->
    manifestPath = path.join gadgetPath, 'manifest.json'
    return unless fs.existsSync manifestPath

    manifest = JSON.parse fs.readFileSync manifestPath
    manifest.id = id
    manifest._gadgetPath = gadgetPath
    manifest.catalog = 'sandbox'
    @appendFilesToManifest manifest, gadgetPath
    return manifest

  updateGadget: (dir) ->
    gadgetPath = path.resolve dir, 'dist'
    originalManifest = _.find @gadgets, (gadget) -> gadget._gadgetPath == gadgetPath
    index = _.indexOf @gadgets, originalManifest
    manifest = @prepareManifest gadgetPath, originalManifest.id
    @gadgets[index] = manifest

  appendFilesToManifest: (manifest, gadgetPath) ->
    unless manifest.files
      # TODO: This is inconsistent: Asset paths must start with api/, while gadget.js and gadget.css - not
      manifest.files =
        'gadget.js': "/gadgets/#{manifest.id}/gadget.js"
        'gadget.css': "/gadgets/#{manifest.id}/gadget.css"
      assets = glob.sync '**/*', cwd: path.join gadgetPath, 'assets'
      _.each assets, (asset) -> manifest.files["assets/#{asset}"] = "/api/gadgets/#{manifest.id}/assets/#{asset}"
