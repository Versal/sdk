fs = require 'fs-extra'
path = require 'path'
async = require 'async'
_ = require 'underscore'

module.exports =
  readManifest: (dir, callback) ->
    manifestPath = @lookupManifest dir
    return callback() unless manifestPath

    fs.readJSON manifestPath, (err, manifest) ->
      if err then return callback err

      callback null, manifest

  lookupManifest: (dir) ->
    candidates = ['versal.json', 'manifest.json', 'manifest.webapp', 'package.json']
    paths = candidates.map (c) -> path.join dir, c
    return _.find paths, fs.existsSync
