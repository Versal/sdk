require('chai').should()
fs = require 'fs'
path = require 'path'
upload = require '../src/upload/upload'
sinon = require 'sinon'
needle = require 'needle'
gadgetPath = path.resolve './test/fixtures/upload'

describe 'Upload', ->
  post = null

  before ->
    post = sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 200 }, { sessionId: 'A1B2' })

  after ->
    post.restore()

  it 'should return a error if destination is not set', (done) ->
    upload.command null, null, (err) ->
      err.should.match /destination is required/
      done()

  it 'should return a error if sessionId is not set', (done) ->
    upload.command 'dest', null, (err) ->
      err.should.match /sessionId is required/
      done()

  it 'should not call post', ->
    post.called.should.be.false

  describe 'post', ->

    before (done) ->
      upload.command gadgetPath, { sessionId: 'X', apiUrl: 'url' }, (e) ->
        done()

    it 'should post gadget', ->
      post.called.should.be.true

    it 'should set buffer', ->
      bundleBuffer = fs.readFileSync "#{gadgetPath}/bundle.zip"
      post.firstCall.args[1].content.buffer.should.eql bundleBuffer

    it 'should set content-type', ->
      post.firstCall.args[1].content.content_type.should.eq 'application/zip'

    it 'should set filename', ->
      post.firstCall.args[1].content.filename.should.eq 'bundle.zip'

    it 'should set sessionId header', ->
      post.firstCall.args[2].headers.session_id.should.eq 'X'
