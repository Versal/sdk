minimatch = require 'minimatch'
fstream = require 'fstream'
chalk = require 'chalk'
tmp = require 'tmp'
fs = require 'fs'
path = require 'path'
async = require 'async'
tar = require 'tar'
zlib = require 'zlib'
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
      bundleOutput = fstream.Writer bundlePath

      # Due to the way tar works we need to chdir
      # to the directory specified on CLI
      initialRoot = process.cwd()
      gadgetRoot = path.resolve dir
      process.chdir gadgetRoot

      reader = fstream.Reader({
        path: gadgetRoot
        type: 'directory'
        # `root` option is undocumented. It's used here to
        # indicate that we want to strip off the parent dir
        root: true
        filter
      }).pipe(tar.Pack())
        .pipe(zlib.Gzip())
        .pipe(bundleOutput)

      bundleOutput.on 'close', ->
        # Switch back to the original project root
        process.chdir initialRoot
        callback null, bundlePath

createIgnoreFilter = (dir, callback) ->
  lookupIgnoreFile dir, (ignorePath) ->
    fs.readFile ignorePath, 'utf-8', (err, content) ->
      if err then return callback err
      ignores = content.split('\n').filter (m) -> m.length
      filter = ->
        # @basename because when the filter is applied the
        # context is the path of the file being considered
        basename = @basename
        ignore = ignores.some (i) -> i && minimatch basename, i
        return !ignore

      callback null, filter

lookupIgnoreFile = (dir, callback) ->
  ignoreCandidates = [
    path.join(dir,IGNORE_FILE),
    path.join(__dirname, '..', IGNORE_FILE)
  ]
  async.detectSeries ignoreCandidates, fs.exists, callback
