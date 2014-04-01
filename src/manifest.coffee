fs = require 'fs-extra'
path = require 'path'
async = require 'async'

module.exports =
  readManifest: (dir, callback) ->
    this.lookupManifest dir, (manifestPath) ->
      if !manifestPath
        return callback new Error('manifest.json not found in ' + dir)

      fs.readJSON manifestPath, (err, manifest) ->
        if err then return callback err
        callback null, manifest

  lookupManifest: (dir, callback) ->
    candidates = ['manifest.json', 'manifest.webapp']
    this.lookup candidates, dir, callback

  lookup: (paths, dir, callback) ->
    paths = paths.map (p) -> path.join dir, p
    async.detectSeries paths, fs.exists, callback

  create: (template) ->
    manifest =
      name: 'my-gadget'
      version: '0.1.0'
      title: 'My gadget'
      description: 'Does nothing just yet'
      author: 'anonymous'
      launcher: 'iframe'

      defaultConfig: {}
      defaultUserState: {}
      #defaultAttributes: {}
      #defaultLearnerState: {}

    Object.getOwnPropertyNames(template).forEach (key) ->
      manifest[key] = template[key]

    return manifest
