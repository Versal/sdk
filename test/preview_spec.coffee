sdk = require '../src/sdk'
path = require 'path'
sinon = require 'sinon'
Bridge = require '../src/bridge/bridge'

describe 'Preview', ->
  gadgetPath = path.resolve './temp/gadgets'

  describe 'gadgets', ->
    bridge = addGadget = null

    before (done) ->
      bridge = new Bridge
      addGadget = sinon.stub bridge, 'addGadget'
      gadgets = ["#{gadgetPath}/preview_gadget_1", "#{gadgetPath}/preview_gadget_2"]
      sdk.createGadget gadgets, ->
        sdk.compile gadgets, ->
          sdk.preview gadgets, { bridge: bridge, test: true }, -> done()

    after ->
      addGadget.restore()

    it 'should call addGadget for every dir', ->
      addGadget.callCount.should.eq 2

  describe 'versal_data', ->
    bridge = addGadget = linkCourse = null
    previewPath = path.resolve './test/fixtures/preview'

    before (done) ->
      bridge = new Bridge
      addGadget = sinon.stub bridge, 'addGadget'
      linkCourse = sinon.stub bridge, 'linkCourse'

      sdk.preview previewPath, { bridge: bridge, test: true }, -> done()

    after ->
      addGadget.restore()
      linkCourse.restore()

    it 'should link gadgets', ->
      addGadget.callCount.should.eq 2

    it 'should link course', ->
      linkCourse.called.should.be.true
      linkCourse.firstCall.args[0].should.eq "#{previewPath}/versal_data/course.json"

