fs = require 'fs-extra'
path = require 'path'
async = require 'async'

module.exports =
  readManifest: (dir, callback) ->
    this.lookupManifest dir, (manifestPath) ->
      return callback() unless manifestPath

      fs.readJSON manifestPath, (err, manifest) ->
        if err then return callback err

        callback null, manifest

  lookupManifest: (dir, callback) ->
    candidates = ['manifest.json', 'manifest.webapp', 'package.json']
    this.lookup candidates, dir, callback

  lookup: (paths, dir, callback) ->
    paths = paths.map (p) -> path.join dir, p
    async.detectSeries paths, fs.exists, callback
