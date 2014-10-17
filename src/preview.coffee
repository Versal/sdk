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
    async.map dirs, maybeLinkLegacyDir.bind(this, app), (err) ->
      if err then return callback err

      coursePath = path.join(__dirname, '../templates/course.json')
      fs.readJson coursePath, (err, course) ->
        if err then return callback err

        # Inject course palette
        course.palette = manifests
        course.isEditable = true

        app.use('/api', api({ manifests, course, assets: [], representations: {} }))
          .use('/components', express.static(path.join(__dirname, '../node_modules')))
          .use(express.static(launchPath))
          .use(express.static(path.join(__dirname, '../html')))
          .use(express.logger())

        if options.port then app.listen options.port
        callback null, manifests

linkManifestDir = (app, dir, callback) ->
  manifest.readManifest dir, (err, json) ->
    if err then return callback(err)
    return callback() unless json

    man = mapManifest json
    man._path = path.resolve dir

    gadgetPath = "api/gadgets/#{man.username}/#{man.name}/#{man.version}/"
    app.use '/' + gadgetPath, express.static(man._path)

    callback null, man

# TODO deprecate along with legacy gadgets
maybeLinkLegacyDir = (app, dir, callback) ->
  manifest.readManifest dir, (err, man) ->
    if err then return callback(err)

    isLegacyGadget = not man.launcher
    if isLegacyGadget
      app.use '/scripts', express.static(path.resolve dir)
    callback null

mapManifest = (manifest) ->
  manifest.id = shortid.generate()
  manifest.catalog = 'local'
  manifest.username = manifest.username || 'local'
  manifest.latestVersion = manifest.version

  manifest.icon ?= 'assets/icon.png'
  manifest.main ?= 'versal.html'

  return manifest
