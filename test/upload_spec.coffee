require('chai').should()
fs = require 'fs-extra'
path = require 'path'
upload = require '../src/upload/upload'
sdk = require '../src/sdk'
sinon = require 'sinon'
needle = require 'needle'

gadgetPath = path.resolve './test/fixtures/upload/bundle.zip'

describe 'Upload', ->
  get = post = null

  beforeEach ->
    post = sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 201 }, { id: '123X' })
    get = sinon.stub(sdk.config, 'get')
    get.withArgs('apiUrl').returns 'http://api/'
    get.withArgs('sessionId').returns 'A1B2'

  afterEach ->
    post.restore()
    get.restore()

  describe 'existing file', ->
    it 'should post bundle.zip to gadgets', (done) ->
      upload.command path.resolve('./test/fixtures/upload/bundle.zip'), null, (err) ->
        post.getCall(0).args[0].should.match /\/gadgets$/
        done()

    it 'should post any other file to assets', (done) ->
      upload.command path.resolve('./test/fixtures/bridge/education.jpg'), null, (err) ->
        post.getCall(0).args[0].should.match /\/assets$/
        done()

    it 'should get sessionId and apiUrl from config', (done) ->
      upload.command path.resolve('./test/fixtures/upload/bundle.zip'), null, (err) ->
        post.getCall(0).args[0].should.match /http:\/\/api\//
        post.getCall(0).args[2].headers.SESSION_ID.should.eq 'A1B2'
        done()

  describe 'existing folder', ->
    it 'should look up for bundle.zip', (done) ->
      upload.command path.resolve('./test/fixtures/upload'), null, (err) ->
        post.getCall(0).args[0].should.match /\/gadgets$/
        done()

  describe 'non-existing file', ->
    it 'should callback with error', (done) ->
      upload.command '/some/invalid/path', null, (err) ->
        err.should.match /nothing to upload/
        done()

  describe 'without filePath', ->
    it 'should callback with error', (done) ->
      upload.command null, null, (err) ->
        err.should.match /specify paths for the files you want to upload/
        done()

  describe 'output', ->
    filepath = './test/fixtures/bridge/education.jpg'
    assetsPath = path.resolve './test/fixtures/upload/assets.json'

    beforeEach ->
      sinon.stub upload, 'outputJson'

    afterEach ->
      upload.outputJson.restore()

    it 'should not call outputJson by default', (done) ->
      upload.command filepath, null, (err) ->
        upload.outputJson.called.should.be.false
        done()

    it 'should store result in outputJson', (done) ->
      upload.command filepath, { output: assetsPath }, (err, body) ->
        upload.outputJson.firstCall.args[1].should.eql { "./test/fixtures/bridge/education.jpg": body[0] }
        done()

    it 'should not call post, if asset already exists in output', (done) ->
      upload.command "/some/existing/file", { output: assetsPath }, (err, body) ->
        post.callCount.should.eq 0
        upload.outputJson.called.should.be.false
        done()

    it 'should call post, if asset already exists in output and --force is specified', (done) ->
      upload.command filepath, { output: assetsPath, force: true }, (err, body) ->
        post.callCount.should.eq 1
        upload.outputJson.called.should.be.true
        done()

  describe 'post', ->
    success = sinon.spy()

    beforeEach (done) ->
      options =
        sessionId: 'X'
        apiUrl: 'url'
        success: success
      upload.command gadgetPath, options, done

    it 'should post gadget', ->
      post.called.should.be.true

    it 'should set buffer', ->
      bundleBuffer = fs.readFileSync gadgetPath
      post.getCall(0).args[1].content.buffer.should.eql bundleBuffer

    it 'should set content-type', ->
      post.getCall(0).args[1].content.content_type.should.eq 'application/zip'

    it 'should set filename', ->
      post.getCall(0).args[1].content.filename.should.eq 'bundle.zip'

    it 'should set sessionId header', ->
      post.getCall(0).args[2].headers.SESSION_ID.should.eq 'X'

    it 'should call options.success', ->
      success.called.should.be.true