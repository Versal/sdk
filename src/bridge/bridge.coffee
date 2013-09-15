jsapi = require 'js-api'
path = require 'path'
fs = require 'fs-extra'
express = require 'express'
require 'express-resource'
shortid = require 'shortid'
_ = require 'underscore'

playerPath = path.join __dirname, '../../player/build/dist'

# We don't need default Backbone.sync, we handle saving differently
jsapi.Backbone.sync = ->

module.exports = class Bridge
  constructor: (options) ->
    @site = express()
    @api = express()
    @data = @datastore()

    # set CORS headers for the bridge
    @allowCORS @site

    # bodyParser supports "uploadDir" option.
    # Unless it is specified, all uploaded assets
    # will be saved in /usr/var directory.
    if options?.baseDir
      options.uploadDir = path.join options.baseDir, 'versal_data/assets'
    @api.use express.bodyParser options

    # set up API routing
    @setupAPI @api, @data

    # serve index
    @site.get '/', @index
    # site servers player files
    @site.use express.static playerPath
    # rewrite 'styles/assets' to 'assets' due to folder
    # configuration discrepancy in compiled and raw player
    @site.use '/styles/assets', express.static "#{playerPath}/assets"

    @site.use '/api', @api

  datastore: ->
    courses: new jsapi.Courses
    assets: new jsapi.Assets
    projects: new jsapi.GadgetProjects

  setupAPI: (api, datastore) ->
    # setup datastore for each api request
    api.use (req, res, next) ->
      req.datastore = datastore
      next()

    # send 200 for /version to indicate it is bridge
    api.get '/version', (req, res) ->
      pkg = require '../../package.json'
      res.type 'html'
      res.send 200, "bridge-#{pkg.version}"

    # send gadget project manifests
    api.get '/gadgets', (req, res) =>
      return res.send @data.projects.toJSON() if req.param('catalog') == 'sandbox'
      res.send []

    courseController = require './courses'
    courses = api.resource 'courses', courseController
    courses.map 'get', '/:course/progress', courseController.showProgress
    courses.map 'put', '/:course/progress', courseController.updateProgress

    lessons = api.resource 'lessons', require './lessons'
    courses.add lessons

    gadgetController = require('./gadgets')
    gadgets = api.resource 'gadgets', gadgetController
    gadgets.map 'put', '/:gadget/config', gadgetController.updateConfig
    gadgets.map 'put', '/:gadget/userstate', gadgetController.updateUserstate
    gadgets.map 'get', '/:gadget/userstate', gadgetController.showUserstate
    lessons.add gadgets

    assetController = require './assets'
    assets = api.resource 'assets', assetController
    assets.map 'get', '/:asset/:representation', assetController.download

  # Set permissive course headers for local bridge
  allowCORS: (app) ->
    app.use (req, res, next) ->
      res.header 'Access-Control-Allow-Origin', '*'
      res.header 'Access-Control-Allow-Headers', 'X-Requested-With, SESSION_ID, SID, Content-Type'
      res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
      next()
    app.options '*', (req, res) -> res.end()

  # start bridge on specified port
  start: (options) ->
    # save port for apiUrl in player config
    @port = options?.port || 3000
    @server = @site.listen @port

  # stop the bridge
  stop: ->
    if @server then @server.close()

  index: (req, res) =>
    return res.send 404, 'No local courses found' unless @data.courses.length
    templatePath = "#{playerPath}/index.html.tmpl"
    template = fs.readFileSync templatePath, 'utf-8'
    config =
      apiUrl: "http://localhost:#{@port}/api"
      sessionId: ''
      courseId: @data.courses.at(0).id
    res.send _.template template, config

  linkCourse: (coursePath, options) ->
    courseJson = require coursePath
    return unless courseJson

    course = new jsapi.Course courseJson
    unless options?.readonly
      course.sync = (method, model) ->
        promise = jsapi.Backbone.$.Deferred()
        fs.writeJson coursePath, model.toJSON({ lessons: true, gadgets: true }), (err) ->
          if err then promise.reject err
          promise.resolve()
        return promise

    @data.courses.add course

  linkGadget: (gadgetPath) ->
    id = shortid.generate()
    manifest = require path.join gadgetPath, 'manifest.json'
    return unless manifest

    manifest.id = shortid.generate()
    manifest.catalog = 'sandbox'

    project = @data.projects.create manifest
    @api.use project.path(), express.static gadgetPath
    @api.get project.manifest(), (req, res) -> res.send project.toJSON()
    @api.get project.code(), (req, res) -> res.send 200
    @api.get project.compiled(), (req, res) -> res.send 200
    project._gadgetPath = gadgetPath

    # FIXME: Legacy stuff - remove on October 2013
    @api.get "/gadgets/#{project.id}", (req, res) -> res.send project.toJSON()
    @api.use "/gadgets/#{project.id}", express.static gadgetPath
    return project
