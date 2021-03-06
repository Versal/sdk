fstream = require 'fstream'
chalk = require 'chalk'
tmp = require 'tmp'
fs = require 'fs'
path = require 'path'
tar = require 'tar'
zlib = require 'zlib'
_ = require 'underscore'
fstreamIgnore = require 'fstream-ignore'

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

    bundlePath = path.join tmpdir, 'bundle.tar.gz'
    bundleOutput = fstream.Writer bundlePath

    # Due to the way tar works we need to chdir
    # to the directory specified on CLI
    initialRoot = process.cwd()
    gadgetRoot = path.resolve dir
    process.chdir gadgetRoot

    reader = fstreamIgnore({
      path: gadgetRoot
      ignoreFiles: ['.versalignore']
      # `root` option is undocumented. It's used here to
      # indicate that we want to strip off the parent dir
      root: true
    })
    # Some defaults we always want to ignore
    reader.addIgnoreRules ['node_modules', '.*']

    reader.pipe(tar.Pack())
      .pipe(zlib.Gzip())
      .pipe(bundleOutput)

    bundleOutput.on 'close', ->
      # Switch back to the original project root
      process.chdir initialRoot
      callback null, bundlePath
