tmp = require 'tmp'
path = require 'path'
fs = require 'fs-extra'
fstream = require 'fstream'
version = require '../src/version'
assert = require 'assert'

gadgetProjectFixtureDir = path.resolve './test/fixtures/iframe-gadget'
gadgetProjectDir = null
originalCwd = process.cwd()

assertVersionInManifest = (projectPath, expectedVersion, callback) ->
  manifestPath = path.join projectPath, 'versal.json'
  actualVersion = fs.readJsonSync(manifestPath).version
  assert.equal expectedVersion, actualVersion
  callback()

copyDirectoryRecursive = (src, dest, callback) ->
  reader = fstream.Reader({ path: src, type: 'Directory' })
  reader.pipe(fstream.Writer({ path: dest, type: 'Directory' }))
  reader.on 'error', callback
  reader.on 'end', callback

describe 'version', ->

  # Make a copy of the gadget project fixture for each example
  beforeEach (done) ->
    tmp.dir (err, tmpdir) ->
      gadgetProjectDir = tmpdir
      copyDirectoryRecursive gadgetProjectFixtureDir, gadgetProjectDir, (err) ->
        if err then return done err
        # Change to the copied directory
        process.chdir gadgetProjectDir
        done()

  afterEach (done) ->
    # Change back to the original cwd
    process.chdir originalCwd
    done()

  it 'should bump prerelease version', (done) ->
    version 'prerelease', (err) ->
      if err then return done err
      assertVersionInManifest gadgetProjectDir, '0.1.1-0', done

  it 'should bump patch version', (done) ->
    version 'patch', (err) ->
      if err then return done err
      assertVersionInManifest gadgetProjectDir, '0.1.1', done

  it 'should bump minor version', (done) ->
    version 'minor', (err) ->
      if err then return done err
      assertVersionInManifest gadgetProjectDir, '0.2.0', done

  it 'should bump major version', (done) ->
    version 'major', (err) ->
      if err then return done err
      assertVersionInManifest gadgetProjectDir, '1.0.0', done

  it 'should bump to a specific version', (done) ->
    version '2.2.2', (err) ->
      if err then return done err
      assertVersionInManifest gadgetProjectDir, '2.2.2', done
