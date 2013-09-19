require('chai').should()
fs = require 'fs'
path = require 'path'
upload = require '../src/upload/upload'
sdk = require '../src/sdk'
sinon = require 'sinon'
needle = require 'needle'
gadgetPath = path.resolve './test/fixtures/upload/bundle.zip'

describe 'Upload', ->
  get = null

  beforeEach ->
    sinon.stub(upload, 'uploadFile').callsArgWith 2, null, { id: '1' }
    get = sinon.stub(sdk.config, 'get')
    get.withArgs('apiUrl').returns 'http://api/'
    get.withArgs('sessionId').returns 'A1B2'

  afterEach ->
    upload.uploadFile.restore()
    get.restore()

  describe 'existing file', ->
    it 'should post bundle.zip to gadgets', (done) ->
      upload.command path.resolve('./test/fixtures/upload/bundle.zip'), null, (err) ->
        upload.uploadFile.getCall(0).args[1].endpoint.should.eq 'gadgets'
        done()

    it 'should post any other file to assets', (done) ->
      upload.command path.resolve('./test/fixtures/bridge/education.jpg'), null, (err) ->
        upload.uploadFile.getCall(0).args[1].endpoint.should.eq 'assets'
        done()

    it 'should get sessionId and apiUrl from config', (done) ->
      upload.command path.resolve('./test/fixtures/upload/bundle.zip'), null, (err) ->
        upload.uploadFile.getCall(0).args[1].apiUrl.should.eq 'http://api/'
        upload.uploadFile.getCall(0).args[1].sessionId.should.eq 'A1B2'
        done()

  describe 'existing folder', ->
    it 'should look up for bundle.zip', (done) ->
      upload.command path.resolve('./test/fixtures/upload'), null, (err) ->
        upload.uploadFile.called.should.be.true
        done()

  describe 'non-existing file', ->
    it 'should callback with error', (done) ->
      upload.command '/some/invalid/path', null, (err) ->
        err.should.match /nothing to upload/
        done()

  describe 'without filePath', ->
    it 'should callback with error', (done) ->
      upload.command null, null, (err) ->
        err.should.match /filepath argument is required/
        done()

  describe 'post', ->
    post = null
    success = sinon.spy()

    before (done) ->
      post = sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 201 }, { sessionId: 'A1B2' })
      options =
        sessionId: 'X'
        apiUrl: 'url'
        success: success
      upload.command gadgetPath, options, done

    it 'should post gadget', ->
      post.called.should.be.true

    it 'should set buffer', ->
      bundleBuffer = fs.readFileSync gadgetPath
      post.firstCall.args[1].content.buffer.should.eql bundleBuffer

    it 'should set content-type', ->
      post.firstCall.args[1].content.content_type.should.eq 'application/zip'

    it 'should set filename', ->
      post.firstCall.args[1].content.filename.should.eq 'bundle.zip'

    it 'should set sessionId header', ->
      post.firstCall.args[2].headers.SESSION_ID.should.eq 'X'

    it 'should call options.success', ->
      success.called.should.be.true