express = require 'express'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
glob = require 'glob'
shortid = require 'shortid'

sdkSite = path.join __dirname, '../../preview'
nodeModules = path.join __dirname, '../../node_modules'
sdkFixtures = path.join __dirname, '../../preview/fixtures'

module.exports = class Bridge
  courseId: 'default'
  gadgets: []
  courses: {}

  constructor: (options = {}) ->
    @site = express()
    api = express()

    @setupAPI(api)

    # Link default course as courses/default
    @linkCourse 'default', sdkFixtures

    @site.get '/', (req, res) => res.send @loadIndex()
    @site.use express.static sdkSite
    @site.use express.static nodeModules
    @site.use '/api', api

  setupAPI: (api) ->
    api.use express.bodyParser()

    api.get '/courses/:course_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        res.send 404 unless course
        res.send course

    api.get '/courses/:course_id/lessons', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        res.send course.lessons

    api.get '/courses/:course_id/lessons/:lesson_id', (req, res) =>
      @findCourse req.params['course_id'], (course) ->
        return res.send 404 unless course
        lesson_id = parseInt req.params['lesson_id']
        lesson = _.find course.lessons, (lesson) -> lesson.id == lesson_id
        res.send lesson

    # Progress
    # GET - return nothing
    api.get '/courses/:id/progress', (req, res) -> res.send {}

    api.get '/gadgets', (req, res) =>
      if req.param('catalog') == 'approved'
        res.send @gadgets
      else
        res.send []

    api.get '/assets', (req, res) =>
      assets = JSON.parse fs.readFileSync path.join sdkFixtures, "assets/#{req.query.tagLead}s.json"
      res.send assets

    # POST, PUT and DELETE various stuff
    # Do nothing
    api.put '/courses/:id/progress', (req, res) -> res.send 200

    api.post '/courses/:id/lessons', (req, res) -> res.send 201
    api.put '/courses/:id/lessons/:lesson_id', (req, res) -> res.send 200
    api.delete '/courses/:id/lessons/:lesson_id', (req, res) -> res.send 200

    api.post '/courses/:id/lessons/:lesson_id/gadgets', (req, res) -> res.send 201
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', (req, res) -> res.send 200
    api.delete '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', (req, res) -> res.send 200
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/config', (req, res) -> res.send 200
    api.put '/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/userstate', (req, res) -> res.send 200

  start: (@port) ->
    @server = @site.listen @port

    console.log ''
    console.log " \\ \\/ /  Starting web server on http://localhost:#{@port}"
    console.log "  \\/ /   Press Ctrl + C to exit..."
    console.log ''

  stop: ->
    if @server then @server.close()

  linkCourse: (id, path) ->
    return unless id
    @courses[id.toString()] = path

  findCourse: (id, callback) ->
    if @courses[id]
      dir = @courses[id]
      callback JSON.parse fs.readFileSync "#{dir}/course.json"
    else
      callback null

  loadIndex: ->
    indexPath = path.join sdkSite, 'index.html'
    content = fs.readFileSync indexPath, 'utf8'
    content = content.replace '%BRIDGE_PORT%', @port
    content = content.replace '%COURSE_ID%', @courseId
    return content

  addGadget: (gadgetPath) ->
    id = shortid.generate()
    manifest = @prepareManifest gadgetPath, id
    return unless manifest

    @gadgets.push manifest

    # Redirect all requests to gadgets/:id to gadget folder
    @site.use "/api/gadgets/#{manifest.id}", express.static gadgetPath

  prepareManifest: (gadgetPath, id) ->
    manifestPath = path.join gadgetPath, 'manifest.json'
    return unless fs.existsSync manifestPath

    manifest = JSON.parse fs.readFileSync manifestPath
    manifest._gadgetPath = gadgetPath
    # Generate random UID for the gadget, unless it is in manifest
    manifest.id = id unless manifest.id
    manifest.type = "gadget/#{manifest.id}"
    manifest.catalog = 'approved'

    @appendFilesToManifest manifest, gadgetPath
    manifest

  updateGadget: (dir) ->
    gadgetPath = path.resolve dir, 'dist'
    originalManifest = _.find @gadgets, (gadget) -> gadget._gadgetPath == gadgetPath
    index = _.indexOf @gadgets, originalManifest
    manifest = @prepareManifest gadgetPath, originalManifest.id
    @gadgets[index] = manifest

  appendFilesToManifest: (manifest, gadgetPath) ->
    # TODO: Fix player counterpart. It requires icon path to be started with "api"
    manifest.icon = "api/gadgets/#{manifest.id}/assets/icon.png"

    unless manifest.files
      # TODO: This is inconsistent: Asset paths must start with api/, while gadget.js and gadget.css - not
      manifest.files =
        'gadget.js': "/gadgets/#{manifest.id}/gadget.js"
        'gadget.css': "/gadgets/#{manifest.id}/gadget.css"
      assets = glob.sync '**/*', cwd: path.join gadgetPath, 'assets'
      _.each assets, (asset) -> manifest.files["assets/#{asset}"] = "/api/gadgets/#{manifest.id}/assets/#{asset}"
