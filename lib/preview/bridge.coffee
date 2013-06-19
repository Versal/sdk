express = require 'express'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
glob = require 'glob'
shortid = require 'shortid'

sdkSite = path.join __dirname, '../../preview'
sdkFixtures = path.join __dirname, '../../preview/fixtures'

module.exports = class Bridge
  constructor: (options = {}) ->
    throw new Error 'port has to be specified' unless options.port

    @url = "http://localhost:#{options.port}"
    @gadgets = []
    @app = express()
    api = express()

    api.use express.bodyParser()

    api.get '/courses/:id', (req, res) ->
      res.sendfile path.join sdkFixtures, 'course.json'

    # Progress
    # GET - return nothing
    api.get '/courses/:id/progress', (req, res) -> res.send {}

    api.get '/courses/:id/lessons', (req, res) ->
      course = JSON.parse fs.readFileSync path.join(sdkFixtures, 'course.json')
      res.send course.lessons

    api.get '/courses/:course_id/lessons/:lesson_id', (req, res) ->
      course = JSON.parse fs.readFileSync path.join sdkFixtures, 'course.json'
      lesson_id = parseInt req.params['lesson_id']
      lesson = _.find course.lessons, (lesson) -> lesson.id == lesson_id
      res.send lesson

    api.get '/gadgets', (req, res) => 
      if req.param('catalog') == 'sandbox'
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

    @app.use express.static sdkSite
    @app.use '/api', api

  addGadget: (gadgetPath) ->
    manifestPath = path.join gadgetPath, 'manifest.json'
    return unless fs.existsSync manifestPath
    
    manifest = JSON.parse fs.readFileSync manifestPath
    # Generate random UID for the gadget, unless it is in manifest
    manifest.id = shortid.generate() unless manifest.id
    manifest.type = "gadget/#{manifest.id}"
    manifest.catalog = 'sandbox'
    manifest.icon = "#{@url}/gadgets/#{manifest.id}/assets/icon.png"
    # TODO: Is this OK? It doesn't belong to here
    manifest.files = @getFiles(manifest.id, gadgetPath) unless manifest.files

    # Redirect all requests to gadgets/:id to gadget folder
    @app.use "/gadgets/#{manifest.id}", express.static gadgetPath
    @gadgets.push manifest

  # Get files hash for local gadgets
  getFiles: (id, gadgetPath) ->
    files = 
      'gadget.js': "#{@url}/gadgets/#{id}/gadget.js"
      'gadget.css': "#{@url}/gadgets/#{id}/gadget.css"
    assets = glob.sync '*.*', cwd: path.join gadgetPath, 'assets'
    _.each assets, (asset) => files["assets/#{asset}"] = "#{@url}/gadgets/#{id}/assets/#{asset}"
    files
