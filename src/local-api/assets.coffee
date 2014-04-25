express = require 'express'
path = require 'path'
formidable = require 'formidable'
shortid = require 'shortid'
_ = require 'underscore'

assets = express()

assets.get '/:id', (req, res) ->
  id = req.param('id')
  if req.representations[id]
    return res.sendfile req.representations[id]
  else if asset = _.findWhere req.assets, { id }
    return res.json asset
  else return res.send 404, "Asset #{id} not found"

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
      ]

    req.assets.push asset
    req.representations[repid] = file.path
    res.send 201, asset

module.exports = assets
