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
      representations: [
        location: "/assets/#{id}/0"
        contentType: file.type
        _filePath: file.path
      ]
    asset = req.datastore.assets.create attrs
    res.send 201, asset.toJSON representations: true

  destroy: (req, res) ->
    req.asset.destroy()
    res.send 200

  download: (req, res) ->
    i = req.params.representation
    res.sendfile req.asset.representations.at(i).get('_filePath')

  load: (req, id, fn) ->
    fn null, req.datastore.assets.get id
