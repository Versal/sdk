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
