sdk = require '../src/sdk'
path = require 'path'
sinon = require 'sinon'
Bridge = require '../src/bridge/bridge'

describe 'Preview', ->
  gadgetPath = path.resolve './temp/gadgets'

  describe 'gadgets', ->
    bridge = linkGadget = null

    before (done) ->
      bridge = new Bridge
      linkGadget = sinon.stub bridge, 'linkGadget'
      gadgets = ["#{gadgetPath}/preview_gadget_1", "#{gadgetPath}/preview_gadget_2"]
      sdk.createGadget gadgets, ->
        sdk.compile gadgets, ->
          sdk.preview gadgets, { bridge: bridge, test: true }, -> done()

    after ->
      linkGadget.restore()

    it 'should call linkGadget for every dir', ->
      linkGadget.callCount.should.eq 2

  describe 'versal_data', sinon.test ->
    bridge = null
    previewPath = path.resolve './test/fixtures/preview'

    before (done) ->
      bridge = new Bridge
      sinon.stub bridge, 'linkGadget'
      sinon.stub bridge, 'linkCoursePath'
      sinon.stub bridge, 'linkAssets'

      sdk.preview previewPath, { bridge: bridge, test: true }, -> done()

    it 'should link gadgets', ->
      bridge.linkGadget.callCount.should.eq 2

    it 'should link course', ->
      bridge.linkCoursePath.calledWith("#{previewPath}/versal_data/course.json", sinon.match.any).should.be.true

    it 'should link assets', ->
      bridge.linkAssets.calledWith("#{previewPath}/versal_data/local_assets.json").should.be.true
