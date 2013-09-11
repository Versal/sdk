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
  # FIXME: Maintain a jsapi collection of assets
  gadgets: []
  users: []
  sessions: []
  progress: {}

  constructor: (options) ->
    @site = express()
    @api = express()

    @assets = new jsapi.Assets

    @setupAPI @api, options

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

    @linkCourse "#{sdkFixtures}/course.json", readonly: true

  setupAPI: (api, options) ->
    api.use express.bodyParser options

    # send 200 for /version to indicate it is bridge
    api.get '/version', (req, res) ->
      res.type 'html'
      res.send 200, "bridge-#{pkg.version}"

    api.get '/courses/:course_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        res.send 404 unless course
        res.send _.extend course.toJSON({ lessons: true, gadgets: true }), isEditable: true

    api.put '/courses/:course_id', (req, res) =>
      @course.set req.body
      res.send 200, @course.toJSON()

    api.get '/courses/:course_id/lessons', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        res.send course.lessons.toJSON()

    api.get '/courses/:course_id/lessons/:lesson_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        lesson_id = req.params['lesson_id']
        lesson = course.lessons.get lesson_id
        res.send lesson.toJSON()

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
      res.sendfile @assets.get(id).representations.at(repId).get('_filePath')

    # get manifest
    api.get '/assets/:id', (req, res) =>
      id = req.param 'id'
      res.send @assets.get(id).toJSON(representations: true)

    # Serve the asset fixtures
    api.use express.static sdkFixtures

    # POST, PUT and DELETE various stuff
    # Do nothing
    api.put '/courses/:id/progress', (req, res) -> res.send {}

    api.post '/courses/:course_id/lessons', (req, res) =>
      attrs = _.extend { id: shortid.generate() }, req.body
      lesson = new jsapi.Lesson attrs, course: @course
      @course.lessons.add lesson
      @saveCourse()
      res.send 201, lesson.toJSON()

    api.put '/courses/:course_id/lessons/:lesson_id', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      lesson.set req.body
      @saveCourse()
      res.send 200, lesson.toJSON()

    api.delete '/courses/:course_id/lessons/:lesson_id', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      @course.lessons.remove lesson
      @saveCourse()
      res.send 200, {}

    api.post '/courses/:course_id/lessons/:lesson_id/gadgets', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      data = _.extend { id: shortid.generate() }, req.body
      gadget = new jsapi.Gadget data
      lesson.gadgets.add gadget, { at: data.index }
      @saveCourse()
      res.send 201, gadget.toJSON()

    api.put '/courses/:course_id/lessons/:lesson_id/gadgets/:gadget_id/config', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      gadget = lesson.gadgets.get req.param 'gadget_id'
      gadget.config.set req.body
      @saveCourse()
      res.send 200, gadget.config.toJSON()

    api.put '/courses/:course_id/lessons/:lesson_id/gadgets/:gadget_id/userstate', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      gadget = lesson.gadgets.get req.param 'gadget_id'
      gadget.userState.set req.body
      @saveCourse()
      res.send 200, gadget.userState.toJSON()

    api.delete '/courses/:course_id/lessons/:lesson_id/gadgets/:gadget_id', (req, res) =>
      lesson = @course.lessons.get req.param 'lesson_id'
      gadget = lesson.gadgets.get req.param 'gadget_id'
      lesson.gadgets.remove gadget
      @saveCourse()
      res.send 200, {}

    api.get '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/config', (req, res) -> res.send {}
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

  linkCourse: (coursePath, options) ->
    return unless fs.existsSync coursePath
    @course = new jsapi.Course fs.readJsonSync coursePath
    @course._coursePath = coursePath

  # TODO: Maybe replace this with @course.save()?
  saveCourse: ->
    fs.writeJson @course._coursePath, @course.toJSON { lessons: true, gadgets: true }

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
    file = req.files['content']
    id = path.basename file.path
    asset =
      id: id
      representations: [
        location: "/assets/#{id}/0"
        contentType: file.type
        _filePath: file.path
      ]
    @assets.add asset
    res.send 201, @assets.get(id).toJSON(representations: true)

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
