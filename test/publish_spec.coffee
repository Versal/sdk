sdk = require '../src/sdk'
path = require 'path'
sinon = require 'sinon'

describe 'Publish', ->
  gadgetPath = path.resolve './temp/gadgets/publish_gadget'
  validate = compress = upload = null

  before (done) ->
    validate = sinon.stub(sdk, 'validate').callsArgWith(2, null)
    compress = sinon.stub(sdk, 'compress').callsArgWith(2, null)
    upload = sinon.stub(sdk, 'upload').callsArgWith(2, null)

    sdk.create gadgetPath, ->
      sdk.publish gadgetPath, -> done()

  after ->
    validate.restore()
    compress.restore()
    upload.restore()

  it 'should call validate', ->
    validate.called.should.be.true

  it 'should call compress', ->
    compress.called.should.be.true

  it 'should call upload', ->
    upload.called.should.be.true
