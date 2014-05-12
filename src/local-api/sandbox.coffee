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
  gadgetPath = manifest._path
  if !gadgetPath then return res.send 404, "Gadget path is undefined"

  fs.exists gadgetPath, (exists) ->
    if !exists then return res.send 404, "Gadget files were not found in the specified path"

    manHelper.readManifest gadgetPath, (err, manifest) ->
      if err then return res.send 500, err
      if !manifest then return res.send 404, "Manifest not found"

      _fetchMySandbox (err, sandbox) ->
        remote = _findManifestInSandbox manifest, sandbox
        if remote && semver.gt(remote.latestVersion, manifest.version)
          return res.send 500, "Latest version of sandboxed gadget is: #{remote.latestVersion}. You have to bump version in manifest.json"

        upload gadgetPath, options(), (err, body) ->
          if err then return res.send 500, err
          res.json body

_fetchMySandbox = (callback) ->
  opts = options()
  url = opts.apiUrl + '/gadgets?catalog=sandbox&user=me'
  headers = sid: opts.sessionId

  request { url, headers}, (err, response, body) ->
    if err then return callback err
    callback null, JSON.parse(body)

_findManifestInSandbox = (manifest, sandbox) ->
  query = { name: manifest.name, version: manifest.version }
  _.findWhere sandbox, query
