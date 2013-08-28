sdk = require '../src/sdk'
path = require 'path'
sinon = require 'sinon'
needle = require 'needle'
publish = require '../src/publish/publish'
should = require('chai').should()

describe 'Publish', ->
  gadgetPath = path.resolve './temp/gadgets/publish_gadget'
  validate = compress = upload = null

  before (done) ->
    sinon.stub sdk.config, 'save'

    validate = sinon.stub(sdk, 'validate').callsArgWith(2, null)
    compress = sinon.stub(sdk, 'compress').callsArgWith(2, null)
    upload = sinon.stub(sdk, 'upload').callsArgWith(2, null)

    sdk.createGadget gadgetPath, ->
      sdk.publish gadgetPath, -> done()

  after ->
    sdk.config.save.restore()
    validate.restore()
    compress.restore()
    upload.restore()

  it 'should call validate', ->
    validate.called.should.be.true

  it 'should call compress', ->
    compress.called.should.be.true

  it 'should call upload', ->
    upload.called.should.be.true

  describe 'verify session', ->
    get = null

    before ->
      get = sinon.stub(needle, 'get').callsArgWith(2, null, { statusCode: 401 })
      get.withArgs('api/user', { headers: { session_id: 'X' }}).callsArgWith(2, null, { statusCode: 200 })

    after ->
      get.restore()

    it 'should callback with error if sessionId is not specified', (done) ->
      publish.verifySession null, (err) ->
        err.should.match /sessionId is required/
        done()

    it 'should return 200 for valid session', (done) ->
      needle.get 'api/user', { headers: { session_id: 'X' }}, (err, res) ->
        res.statusCode.should.eq 200
        done()

    it 'should return 401 for invalid session', (done) ->
      needle.get 'user', { headers: { session_id: 'Y' }}, (err, res) ->
        res.statusCode.should.eq 401
        done()

    it 'should not return err if session is valid', (done) ->
      publish.verifySession { sessionId: 'X', apiUrl: 'api' }, (err) ->
        should.not.exist err
        done()

    it 'should return err if session is invalid', (done) ->
      publish.verifySession { sessionId: 'Y', apiUrl: 'api' }, (err) ->
        err.should.match /not verify session/
        done()
