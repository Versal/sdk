require('chai').should()
fs = require 'fs'
path = require 'path'
upload = require '../src/upload/upload'
sinon = require 'sinon'
needle = require 'needle'
gadgetPath = path.resolve './test/fixtures/upload/bundle.zip'

describe 'Upload', ->
  post = null

  before ->
    post = sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 201 }, { sessionId: 'A1B2' })

  after ->
    post.restore()

  it 'should return a error if destination is not set', (done) ->
    upload.command null, null, (err) ->
      err.should.match /provide a path to bundle.zip/
      done()

  it 'should not call post', ->
    post.called.should.be.false

  describe 'post', ->
    success = sinon.spy()

    before (done) ->
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
