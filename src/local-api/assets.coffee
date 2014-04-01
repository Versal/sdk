express = require 'express'
path = require 'path'
formidable = require 'formidable'
shortid = require 'shortid'
_ = require 'underscore'

assets = express()

assets.get '/:id', (req, res) ->
  id = req.param('id')
  if req.datastore.representations[id]
    return res.sendfile req.datastore.representations[id]
  else
    return res.json _.findWhere req.datastore.assets, { id }

assets.post '/', (req, res) ->
  form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse req, (err, fields, files) =>
    if err then return res.send 500, err

    file = files.content
    id = shortid()
    repid = shortid()

    asset =
      id: id
      representations: [
        id: repid
        location: 'deprecated'
        contentType: file.type
        available: true
        original: true
        scale: '800x600'
      ]

    req.datastore.assets.push asset
    req.datastore.representations[repid] = file.path
    res.send 201, asset

module.exports = assets
