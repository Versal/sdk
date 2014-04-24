express = require 'express'
path = require 'path'
api = require './local-api'
cors = require 'cors'
async = require 'async'
manifest = require './manifest'
shortid = require 'shortid'
fs = require 'fs-extra'

module.exports = (dirs, options, callback = ->) ->
  if typeof dirs == 'string' then dirs = [dirs]

  if options.iframe
    launchPath = path.resolve __dirname, '../iframe'
  else if options.player
    launchPath = path.resolve __dirname, options.player
  else
    launchPath = path.resolve __dirname, '../html/player'

  app = express()
    .use(cors())
    .use(express.json())
    .use(express.urlencoded())

  async.map dirs, linkManifestDir.bind(this, app), (err, manifests) ->
    if err then return callback err

    coursePath = path.join(__dirname, '../templates/course.json')
    fs.readJson coursePath, (err, course) ->
      if err then return callback err

      # Inject course palette
      course.palette = manifests
      course.isEditable = true

      app.use('/api', api({ manifests, course, assets: [], representations: {} }))
        .use(express.static(launchPath))
        .use(express.static(path.join(__dirname, '../html')))
        .use(express.logger())

      if options.port then app.listen options.port
      callback null, manifests

linkManifestDir = (app, dir, callback) ->
  manifest.readManifest dir, (err, json) ->
    if err then return callback(err)
    return callback() unless json

    manifest = mapManifest json
    linkPath = path.resolve dir

    if manifest.launcher == 'element'
      elementPath = path.join('elements', manifest.name, manifest.version)
      app.use '/' + elementPath, express.static(linkPath)
    else
      gadgetPath = "api/gadgets/#{manifest.username}/#{manifest.name}/#{manifest.version}/"
      app.use '/' + gadgetPath, express.static(linkPath)

    callback null, manifest

mapManifest = (manifest) ->
  manifest.id = shortid.generate()
  manifest.catalog = 'sandbox'
  manifest.username = 'local'
  manifest.latestVersion = manifest.version
  return manifest
