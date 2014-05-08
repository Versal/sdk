_ = require 'underscore'
express = require 'express'
upload = require '../upload'
config = require('../config')()

module.exports = sandbox = express()

sandbox.put '/', (req, res) ->
  id = req.param('id')
  manifest = _.findWhere req.manifests, { id }
  path = manifest._path
  options =
    apiUrl: config.get 'apiUrl'
    sid: config.get 'sessionId'

  console.log 'uploading ', path, options
  upload path, options, (err, body) ->
    if err then return res.send 500, err
    res.json body
