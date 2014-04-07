{ exec, spawn } = require('child_process')
assert = require 'assert'
tmp = require 'tmp'
path = require 'path'
fs = require 'fs'

versal = path.resolve __dirname, '../bin/versal'

describe 'versal cli', ->
  cwd = null

  before (done) ->
    tmp.dir (err, dir) ->
      cwd = dir
      done err

  it 'version', (done) ->
    exec "#{versal} -v", (err, stdout, stderr) ->
      assert.equal stdout.trim(), process.env.npm_package_version
      assert !stderr
      done(err)

  it 'usage', (done) ->
    exec "#{versal}", (err, stdout, stderr) ->
      assert stdout.length
      assert !stderr
      done(err)

  it 'create foo', (done) ->
    exec "#{versal} create foo", { cwd }, (err, stdout, stderr) ->
      fs.exists path.join(cwd, 'foo/manifest.json'), (exists) ->
        assert exists
        done()

  describe 'preview foo', ->
    preview = null

    after ->
      if preview && !preview.killed then preview.kill()

    it 'on port 3073', (done) ->
      preview = spawn versal, ['preview', 'foo', '--port', '3073'], { cwd }

      preview.stdout.on 'data', (data) ->
        if data.toString().indexOf('localhost:3073') > 0
          preview.kill 'SIGINT'

      preview.stderr.on 'data', (err) ->
        done new Error err.toString()

      preview.on 'close', (code,signal) ->
        assert.equal code, 130
        done()

  describe 'signin', ->
    signin = null

    after ->
      if signin && !signin.killed then signin.kill()

    it 'with credentials', (done) ->
      args = ['signin',
        '--authUrl', 'versal-api',
        '--email', 'foo',
        '--password', 'bar']
      signin = spawn versal, args, { cwd }

      signin.stdout.on 'data', (data) ->
        if data.toString().indexOf('Signing in to versal-api') == 0
          signin.kill 'SIGINT'
          assert true
          done()

      signin.stderr.on 'data', (err) ->
        done new Error err.toString()

  # We terminate the process after manifest is found and
  # apiUrl is established
  describe 'upload', ->
    upload = null

    after ->
      if upload && !upload.killed then upload.kill()

    it 'with credentials', (done) ->
      upload = spawn versal, ['upload', 'foo', '--apiUrl', 'versal-api', '--sid', 'foo'], { cwd }

      upload.stdout.on 'data', (data) ->
        if data.toString().indexOf('foo@0.0.1 to versal-api') > 0
          upload.kill 'SIGINT'
          assert true
          done()

      upload.stderr.on 'data', (err) ->
        done new Error err.toString()
