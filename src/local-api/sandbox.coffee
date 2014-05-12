_ = require 'underscore'
fs = require 'fs'
express = require 'express'
upload = require '../upload'
config = require('../config')()

module.exports = sandbox = express()

sandbox.put '/', (req, res) ->
  id = req.param('id')
  manifest = _.findWhere req.manifests, { id }
  gadgetPath = manifest._path
  options =
    apiUrl: config.get 'apiUrl'
    sessionId: config.get 'sessionId'

  if !gadgetPath then return res.send 404, "Gadget path is undefined"

  fs.exists gadgetPath, (exists) ->
    if !exists then return res.send 404, "Gadget files were not found in the specified path"

    upload gadgetPath, options, (err, body) ->
      if err then return res.send 500, err
      res.json body
