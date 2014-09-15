exec = require('child_process').exec
minimatch = require 'minimatch'
fstream = require 'fstream'
chalk = require 'chalk'
tmp = require 'tmp'
fs = require 'fs'
path = require 'path'
async = require 'async'

IGNORE_FILE = '.versalignore'

module.exports =
  createZip: (dir, callback) ->
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
          .on 'end', ->
            console.log chalk.yellow('Creating bundle.zip')
            zipFilesInFolder tmpdir, (err, bundlePath) ->
              if err then return callback err
              getBundleSize bundlePath, (err, bundleSize) ->
                console.log chalk.grey "bundle path: #{bundlePath}"
                console.log chalk.grey "bundle size: #{bundleSize}KB"
                bundleStream = fs.createReadStream bundlePath
                callback null, bundleStream

getBundleSize = (bundlePath, callback) ->
  fs.stat bundlePath, (err, stats) ->
    if err then return callback err
    size = parseInt(stats.size / 1024, 10)
    callback null, size

zipFilesInFolder = (tmpdir, callback) ->
  bundlePath = path.join tmpdir, 'bundle.zip'
  # Ugh. Replace with .tar.gz, if we can get platform support
  zip = exec "zip -r bundle.zip .", cwd: tmpdir, (err) ->
    if err
      message = "zip process exited with code #{err.code}"
      return callback new Error message

    process.nextTick ->
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
