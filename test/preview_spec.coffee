sdk = require '../src/sdk'
path = require 'path'
sinon = require 'sinon'
Bridge = require '../src/preview/bridge'

describe 'Preview', ->
  bridge = new Bridge
  gadgetPath = path.resolve './temp/gadgets'
  addGadget = sinon.stub bridge, 'addGadget'

  before (done) ->
    gadgets = ["#{gadgetPath}/preview_gadget_1", "#{gadgetPath}/preview_gadget_2"]
    sdk.createGadget gadgets, ->
      sdk.compile gadgets, ->
        sdk.preview gadgets, { bridge: bridge, test: true }, -> done()

  after ->
    addGadget.restore()

  it 'should call addGadget for every dir', ->
    addGadget.callCount.should.eq 2

