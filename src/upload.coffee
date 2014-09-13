fs = require 'fs'
path = require 'path'
chalk = require 'chalk'
request = require 'request'
restapi = require './restapi'
validator = require './validator'
bundle = require './bundle'

module.exports = (dir, options, callback) ->
  console.log chalk.yellow 'Validating gadget'
  apiUrl = options.apiUrl + '/gadgets'

  validator.checkProject dir, options, (err) ->
    if err then return callback err
    # If we could fix receiving endpoint, we could do
    # reader.pipe(tar.Pack()).pipe(request.post(...))
    bundle.createZip dir, (err, bundleStream) ->
      if err then return callback err
      uploadBundleToRestAPI apiUrl, bundleStream, options, callback

uploadBundleToRestAPI = (apiUrl, bundleStream, options, callback) ->
  opts =
    url: apiUrl
    headers:
      SID: options.sessionId

  req = request.post opts, restapi.jsonResponseHandler(callback)
  req.form().append('content', bundleStream)
