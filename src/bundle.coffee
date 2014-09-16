exec = require('child_process').exec
minimatch = require 'minimatch'
fstream = require 'fstream'
chalk = require 'chalk'
tmp = require 'tmp'
fs = require 'fs'
path = require 'path'
async = require 'async'
archiver = require 'archiver'
readDirSyncRecursive = require 'fs-readdir-recursive'
_ = require 'underscore'

IGNORE_FILE = '.versalignore'

module.exports =
  createBundle: (dir, callback) ->

    console.log chalk.yellow('Creating bundle.tar.gz')

    bundleFilesInFolder dir, (err, bundlePath) ->
      if err then return callback err

      getBundleSize bundlePath, (err, bundleSize) ->
        if err then return callback err

        console.log chalk.grey "bundle path: #{bundlePath}"
        console.log chalk.grey "bundle size: #{bundleSize}KB"

        bundleStream = fs.createReadStream bundlePath
        callback null, bundleStream

getBundleSize = (bundlePath, callback) ->
  fs.stat bundlePath, (err, stats) ->
    if err then return callback err

    size = parseInt(stats.size / 1024, 10)
    callback null, size

bundleFilesInFolder = (dir, callback) ->
  tmp.dir (err, tmpdir) ->
    if err then return callback err

    createIgnoreFilter dir, (err, filter) ->
      if err then return callback err

      bundlePath = path.join tmpdir, 'bundle.tar.gz'
      bundleOutput = fs.createWriteStream bundlePath

      bundle = archiver 'tar',
        gzip: true
        gzipOptions:
          level: 1

      bundleFiles = _.select readDirSyncRecursive(dir), filter
      bundle.on 'error', callback
      bundle.pipe bundleOutput

      bundleFiles.forEach (name) ->
        filePath = path.resolve name
        stream = fs.createReadStream filePath
        bundle.append stream, { name }

      bundle.finalize()

      bundleOutput.on 'close', ->
        callback null, bundlePath

createIgnoreFilter = (dir, callback) ->
  lookupIgnoreFile dir, (ignorePath) ->
    fs.readFile ignorePath, 'utf-8', (err, content) ->
      if err then return callback err
      ignores = content.split('\n').filter (m) -> m.length
      filter = (file) ->
        basename = path.basename file

        ignore = ignores.some (i) -> i && minimatch basename, i
        return !ignore

      callback null, filter

lookupIgnoreFile = (dir, callback) ->
  ignoreCandidates = [
    path.join(dir,IGNORE_FILE),
    path.join(__dirname, '..', IGNORE_FILE)
  ]
  async.detectSeries ignoreCandidates, fs.exists, callback
