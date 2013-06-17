sdk = require '../../lib/sdk'
path = require 'path'
sinon = require 'sinon'
Bridge = require '../../lib/preview/bridge'

bridge = new Bridge port: 3000
gadgetPath = path.resolve './temp/gadgets'

describe 'Preview', ->
  before (done) ->
    @addGadget = sinon.stub bridge, 'addGadget'
    gadgets = ["#{gadgetPath}/preview_gadget_1", "#{gadgetPath}/preview_gadget_2"]
    sdk.create gadgets, ->
      sdk.compile gadgets, ->
        sdk.preview gadgets, { bridge: bridge, test: true }, -> done()

  after ->
    @addGadget.restore()

  it 'should call addGadget for every dir', ->
    @addGadget.callCount.should.eq 2

