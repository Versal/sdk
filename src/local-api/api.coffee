async = require 'async'
chalk = require 'chalk'
express = require 'express'
shortid = require 'shortid'
cors = require 'cors'
fs = require 'fs-extra'
path = require 'path'
formidable = require 'formidable'
manifest = require '../manifest'
_ = require 'underscore'

module.exports = class LocalAPI

  constructor: () ->
    this.app = express()
    this.setupDatastore()
    this.setupApi(this.app)

  setupDatastore: ->
    courseJson = fs.readJsonSync path.join(__dirname, '../../templates/course.json')
    data =
      assets: []
      projects: []
      course: courseJson
      representations: {}
    this.data = data

  setupApi: (api) ->
    api.use express.json()
    api.use express.urlencoded()

    api.all '*', (req, res, next) =>
      req.datastore = this.data
      next()

    api.get '/gadgets', (req, res) =>
      return res.json @data.projects if req.param('catalog') == 'sandbox'
      res.send []

    courses = require './courses'
    lessons = require './lessons'
    gadgets = require './gadgets'

    api.all '/courses/:courseid*', courses.load
    api.all '/courses/:courseid/lessons/:lessonid*', lessons.load
    api.all '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid*', gadgets.load

    api.use gadgets
    api.use lessons
    api.use courses

    api.use '/assets', require('./assets')

  middleware: -> this.app

  linkGadgetReduce: (cnt, dir, callback) ->
    this.linkGadget dir, (err, project) ->
      if err
        console.log chalk.red(err.message)
        return callback err

      if project
        console.log chalk.grey(project.name + '@' + project.version + ' is connected')
        return callback null, ++cnt
      return callback null, cnt

  linkGadget: (dir, callback = ->) ->
    manifest.readManifest dir, (err, manifest) =>
      if err then return callback err
      if !manifest then return callback null, null

      project = this.mapManifest(manifest)
      this.data.projects.push project

      this.app.get project.manifest(), (req, res) -> res.json _.omit(project, 'manifest', 'path')
      this.app.use project.path(), express.static(dir)

      callback null, project

  mapManifest: (manifest) ->
    manifest.id = shortid.generate()
    manifest.catalog = 'sandbox'
    manifest.username = 'local'
    manifest.latestVersion = manifest.version

    manifest.path = (filename) ->
      filepath = ['/gadgets', manifest.username, manifest.name, manifest.version].join '/'
      if filename then filepath += '/' + filename
      return filepath

    manifest.manifest = -> this.path('manifest')

    return manifest
