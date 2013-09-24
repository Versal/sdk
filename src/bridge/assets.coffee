path = require 'path'

module.exports =
  index: (req, res) ->
    res.send req.datastore.assets.toJSON representations: true

  show: (req, res) ->
    res.send req.asset.toJSON representations: true

  create: (req, res) ->
    file = req.files['content']
    id = path.basename file.path
    attrs =
      id: id
      _path: file.path
      representations: [
        location: "/assets/#{id}/0"
        contentType: file.type
      ]
    asset = req.datastore.assets.create attrs
    asset.collection.save()
    res.send 201, asset.toJSON representations: true

  destroy: (req, res) ->
    req.asset.destroy()
    req.asset.collection.save()
    res.send 200

  download: (req, res) -> res.sendfile req.asset.get('_path')

  load: (req, id, fn) ->
    fn null, req.datastore.assets.get id
