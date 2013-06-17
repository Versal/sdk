_ = require 'underscore'
sdk = require '../../lib/sdk'
path = require 'path'
async = require 'async'

module.exports = publish =
  command: (dest, options = {}, callback = ->) ->
    unless dest
      return callback new Error("path for publish must be provided")

    dest = path.resolve dest
    
    async.series
      validate: (cb) -> sdk.validate dest, options, cb
      compress: (cb) -> sdk.compress dest, options, cb
      upload: (cb) -> sdk.upload dest, options, cb
    , callback
