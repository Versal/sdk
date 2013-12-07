jsapi = require 'js-api'
path = require 'path'
fs = require 'fs-extra'
express = require 'express'
require 'express-resource'
shortid = require 'shortid'
_ = require 'underscore'
pkg = require '../../package.json'
compile = require '../compile/compile'

playerPath = path.join __dirname, '../../node_modules/player/dist'
indexTemplatePath = path.join __dirname, '../../node_modules/player/app/index.html.tmpl'
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
    # TODO: This is not obvious. Fix this.
    if options?.baseDir
      assetsDir = path.join options.baseDir, 'versal_data/assets'
      if fs.existsSync assetsDir then options.uploadDir = assetsDir

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
    data =
      courses: new jsapi.Courses
      assets: new jsapi.Assets
      projects: new jsapi.GadgetProjects
    # By default, set assets save to noop. It might get overriden by linkAssets.
    data.assets.save = ->
    data

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
    courses.map 'post', '/:course/start', courseController.start
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
    template = fs.readFileSync indexTemplatePath, 'utf-8'
    title = "SDK [#{pkg.version}]"
    config = JSON.stringify
      api:
        url: "http://localhost:#{@port}/api"
        sessionId: ''
      courseId: @data.courses.at(0).id
      collabUrl: null
    res.send _.template template, { config, @port, host: req.header('host'), title }, variable: 'data'

  linkCoursePath: (coursePath, options) ->
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
      course.sync = _.debounce course.sync, 250

    @linkCoursePath course, options

  linkCourse: (course, options) ->
    unless options?.learn
      course.set 'isEditable', true
    @data.courses.add course

  linkAssets: (assetsPath, options) ->
    assetsJson = require assetsPath
    return unless assetsJson
    assets = @data.assets
    unless options?.readonly
      @data.assets.save = ->
        promise = jsapi.Backbone.$.Deferred()
        fs.writeJson assetsPath, assets.toJSON(representations: true), (err) ->
          if err then promise.reject err
          promise.resolve()
    assets.add assetsJson

  linkGadget: (gadgetPath) ->
    id = shortid.generate()
    manifest = require path.join gadgetPath, 'manifest.json'
    return false unless manifest

    manifest.id = shortid.generate()
    manifest.catalog = 'sandbox'

    project = @data.projects.create manifest
    @api.use project.path(), express.static gadgetPath
    @api.get project.css(), (req, res) ->
      css = fs.readFileSync path.join(gadgetPath, 'gadget.css'), 'utf-8'
      compiledCss = compile.processCss css, project.cssClassName()
      res.set 'Content-Type', 'text/css; charset=UTF-8'
      res.send compiledCss
    @api.get project.manifest(), (req, res) -> res.send project.toJSON()
    @api.get project.code(), (req, res) -> res.send 200
    @api.get project.compiled(), (req, res) -> res.send 200
    project._gadgetPath = gadgetPath
    return project
