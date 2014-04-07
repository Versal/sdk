fs = require 'fs'
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
  # If we could fix receiving endpoint, we could do
  # reader.pipe(tar.Pack()).pipe(request.post(...))
  createBundleZip dir, (err, bundlePath) ->
    if err then return callback err
    uploadBundleToRestAPI bundlePath, options, callback

touchLegacyFile = (dir, fileName) ->
  filePath = path.join dir, fileName
  unless fs.existsSync filePath
    fs.writeFileSync filePath, '/* Nothing to see here */'

createBundleZip = (dir, callback) ->
  createIgnoreFilter dir, (err, filter) ->
    if err then return callback err

    tmp.dir (err, tmpdir) ->
      if err then return callback err

      # TODO: remove once the rest-api stops asserting that these exist
      ['gadget.js', 'gadget.css'].map touchLegacyFile.bind @, tmpdir

      console.log chalk.yellow('Reading source directory:')
      reader = fstream.Reader({ path: dir, type: 'Directory', filter })
      reader.on 'error', callback
      reader.on 'entry', (e) -> console.log chalk.grey(e.path.slice(e.dirname.length))
      reader.on 'end', zipFilesInFolder.bind(this, tmpdir, callback)

      reader.pipe(fstream.Writer({ path: tmpdir, type: 'Directory' }))

zipFilesInFolder = (tmpdir, callback) ->
  console.log chalk.yellow('Creating bundle.zip')
  bundlePath = path.join tmpdir, 'bundle.zip'
  # Ugh. Replace with .tar.gz, if we can get platform support
  zip = exec "zip -r bundle.zip .", cwd: tmpdir, (err) ->
    if err
      return callback new Error "zip process exited with code #{err.code}"

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

  console.log chalk.yellow "Uploading file to #{opts.url}"

  req = request.post opts, (err, res, body) ->
    handleRestApiResponse err, res, JSON.parse(body), callback

  req.form().append 'content', fs.createReadStream bundlePath

handleRestApiResponse = (err, res, body, callback) ->
  if err then return callback err
  if res.statusCode >= 300 then return callback new Error body.message

  callback(null, body)
