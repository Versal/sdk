fs = require 'fs'
path = require 'path'
chalk = require 'chalk'
request = require 'request'
restapi = require './restapi'
validator = require './validator'
bundle = require './bundle'

module.exports = (dir, options, callback) ->
  console.log chalk.yellow 'Validating gadget'
  validator.checkProject dir, options, (err) ->
    if err then return callback err

    # If we could fix receiving endpoint, we could do
    # reader.pipe(tar.Pack()).pipe(request.post(...))
    bundle.createZip dir, (err, bundlePath) ->
      if err then return callback err
      uploadBundleToRestAPI bundlePath, options, callback

uploadBundleToRestAPI = (bundlePath, options, callback) ->
  opts =
    url: options.apiUrl + '/gadgets'
    headers:
      SID: options.sessionId

  fs.stat bundlePath, (err, stats) ->
    if err then return callback err

    size = parseInt(stats.size / 1024, 10)
    console.log chalk.yellow "Uploading #{size}KB to #{opts.url}"

    req = request.post opts, restapi.jsonResponseHandler(callback)
    req.form().append('content', fs.createReadStream(bundlePath))
