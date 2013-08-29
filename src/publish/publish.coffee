_ = require 'underscore'
sdk = require '../../src/sdk'
path = require 'path'
async = require 'async'
needle = require 'needle'
config = require '../../src/config'

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

  verifySession: (options = {}, callback) ->
    unless options.sessionId
      return callback new Error 'sessionId is required to verify session'

    apiUrl = options.apiUrl || config.get 'apiUrl'
    unless apiUrl
      return callback new Error 'apiUrl is required to verify session'

    requestOptions =
      headers:
        session_id: options.sessionId

    needle.get "#{apiUrl}/user", requestOptions, (err, res, body) ->
      return callback() if res.statusCode == 200
      return callback err if err
      callback new Error("Could not verify session")
