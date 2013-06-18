sdk = require '../../lib/sdk'
path = require 'path'
sinon = require 'sinon'

gadgetPath = path.resolve './temp/gadgets/publish_gadget'

# TODO: Fix this test
return false

describe 'Publish', ->
  before (done) ->
    @validate = sinon.stub(sdk, 'validate').callsArgWith(2, null)
    @compress = sinon.stub(sdk, 'compress').callsArgWith(2, null)
    # TODO: Figure out whats happening here:
    # @upload = sinon.stub(sdk, 'upload').callsArgWith(2, null)

    sdk.create gadgetPath, ->
      sdk.publish gadgetPath, -> done()

  it 'should call validate', ->
    @validate.called.should.be.true

  it 'should call compress', ->
    @compress.called.should.be.true

  #it 'should call upload', ->
  #  @upload.called.should.be.true
