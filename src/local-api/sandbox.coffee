_ = require 'underscore'
fs = require 'fs'
express = require 'express'
upload = require '../upload'
config = require('../config')()
request = require 'request'
manHelper = require '../manifest'
semver = require 'semver'

module.exports = sandbox = express()

options = ->
  apiUrl: config.get 'apiUrl'
  sessionId: config.get 'sessionId'

sandbox.get '/', (req, res) ->
  _fetchMySandbox (err, sandbox) ->
    if err then return res.send 500, err
    res.json sandbox

sandbox.put '/', (req, res) ->
  id = req.param('id')

  manifest = _.findWhere req.manifests, { id }
  if !manifest then return res.send 404, 'Manifest not found'

  gadgetPath = manifest._path
  if !gadgetPath then return res.send 404, 'Gadget path is undefined'

  fs.exists gadgetPath, (exists) ->
    if !exists then return res.send 404, 'Gadget files were not found in the specified directory'

    _fetchMySandbox (err, sandbox) ->
      if err then return res.send 500, err.message

      remoteManifest = _findManifestInSandbox manifest, sandbox
      if remoteManifest && semver.gt(remoteManifest.latestVersion, manifest.version)
        return res.send 500, "Upload failed.\n\nLatest version of sandboxed gadget is: #{remoteManifest.latestVersion}.\n You must bump version in manifest.json to upload this gadget."

      upload gadgetPath, options(), (err, body) ->
        if err then return res.send 500, err
        res.json body

_fetchMySandbox = (callback) ->
  opts = options()
  url = opts.apiUrl + '/gadgets?catalog=sandbox&user=me'
  headers = sid: opts.sessionId

  if !opts.sessionId then return callback new Error 'Session id not found. Run versal signin first.'

  request { url, headers}, (err, res, body) ->
    if err then return callback err
    data = JSON.parse body
    if res.statusCode != 200 then return callback data
    callback null, data

_findManifestInSandbox = (manifest, sandbox) ->
  query = { name: manifest.name, version: manifest.version }
  _.findWhere sandbox, query
