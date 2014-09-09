fs = require 'fs'
_ = require 'underscore'
semver = require 'semver'
path = require 'path'
async = require 'async'
exec = require('child_process').exec
tmp = require 'tmp'
chalk = require 'chalk'
fstream = require 'fstream'
minimatch = require 'minimatch'
request = require 'request'
manifest = require './manifest'

IGNORE_FILE = '.versalignore'

module.exports = (dir, options, callback) ->
  validateGadgetProject dir, options, (err) ->
    if err then return callback err

    createBundleZip dir, (err, bundlePath) ->
      if err then return callback err
      uploadBundleToRestAPI bundlePath, options, callback

touchLegacyFile = (dir, fileName) ->
  filePath = path.join dir, fileName
  unless fs.existsSync filePath
    fs.writeFileSync filePath, '/* Nothing to see here */'

# If we could fix receiving endpoint, we could do
# reader.pipe(tar.Pack()).pipe(request.post(...))
createBundleZip = (dir, callback) ->
  createIgnoreFilter dir, (err, filter) ->
    if err then return callback err

    tmp.dir (err, tmpdir) ->
      if err then return callback err

      console.log chalk.yellow('Reading source directory:')
      reader = fstream.Reader({ path: dir, type: 'Directory', filter })
      reader.on 'error', callback
      reader.on 'entry', (e) -> console.log chalk.grey(e.path.slice(e.dirname.length))

      reader.pipe(fstream.Writer({ path: tmpdir, type: 'Directory' }))
        .on('error', callback)
        .on('end', zipFilesInFolder.bind(this, tmpdir, callback))


zipFilesInFolder = (tmpdir, callback) ->
  console.log chalk.yellow('Creating bundle.zip')
  bundlePath = path.join tmpdir, 'bundle.zip'
  # Ugh. Replace with .tar.gz, if we can get platform support
  zip = exec "zip -r bundle.zip .", cwd: tmpdir, (err) ->
    if err
      return callback new Error "zip process exited with code #{err.code}"

    process.nextTick ->
      console.log chalk.grey 'bundle path:', bundlePath
      callback null, bundlePath

createIgnoreFilter = (dir, callback) ->
  lookupIgnoreFile dir, (ignorePath) ->
    fs.readFile ignorePath, 'utf-8', (err, content) ->
      if err then return callback err
      ignores = content.split('\n').filter (m) -> m.length
      filter = ->
        basename = this.basename
        ignore = ignores.some (i) -> i && minimatch basename, i
        return !ignore

      callback null, filter

lookupIgnoreFile = (dir, callback) ->
  ignoreCandidates = [
    path.join(dir,IGNORE_FILE),
    path.join(__dirname, '..', IGNORE_FILE)
  ]
  async.detectSeries ignoreCandidates, fs.exists, callback

uploadBundleToRestAPI = (bundlePath, options, callback) ->
  opts =
    url: options.apiUrl + '/gadgets'
    headers:
      SID: options.sessionId

  fs.stat bundlePath, (err, stats) ->
    if err then return callback err

    size = parseInt(stats.size / 1024, 10)
    console.log chalk.yellow "Uploading #{size}KB to #{opts.url}"

    req = request.post opts, (err, res, body) ->
      handleRestApiResponse err, res, JSON.parse(body), callback

    req.form().append('content', fs.createReadStream(bundlePath))

handleRestApiResponse = (err, res, body, callback) ->
  if err then return callback err
  if res.statusCode >= 300 then return callback new Error(body.message)

  callback(null, body)

getGadgetCatalog = (catalog, options, callback) ->
  opts =
    url: options.apiUrl + '/gadgets'
    qs:
      catalog: catalog
      user: 'me'
    headers:
      SID: options.sessionId

  request.get opts, (err, res, body) ->
    handleRestApiResponse err, res, JSON.parse(body), callback

versionExists = (manifest, gadgets) ->
  otherGadgetVersions = _.select gadgets, (gadget) ->
    manifest.name == gadget.name
  return _.any otherGadgetVersions, (gadget) ->
    return semver.gte gadget.version, manifest.version


# TODO function and supporting functions are a temporary measure
# until rest-api#1693 is resolved
validateGadgetProject = (dir, options, callback) ->
  console.log chalk.yellow 'Validating gadget'

  async.concat ['approved', 'sandbox'], (catalog, cb) ->
    getGadgetCatalog catalog, options, cb
  , (err, gadgets) ->

    manifest.readManifest dir, (err, manifestInfo) ->
      if err then return callback err

      if versionExists manifestInfo, gadgets
        manifest.lookupManifest dir, (manifestPath) ->
          errorMessage = "Version 'v#{manifestInfo.version}' or greater " +
          "already exists. Bump the version in '#{path.basename manifestPath}' " +
          "before uploading."
          return callback(new Error(errorMessage))

      else
        return callback()
