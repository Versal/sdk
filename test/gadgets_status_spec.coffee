require('chai').should()
_ = require 'underscore'
needle = require 'needle'
sinon = require 'sinon'
status = require '../src/gadget/status'
approve = require '../src/gadget/approve'
reject = require '../src/gadget/reject'

describe 'Status', ->
  options =
    apiUrl: 'http://api/'
    sessionId: 'X73'
    catalog: 'approved'

  beforeEach ->
    sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 200 }, { id: '123X' })

  afterEach ->
    needle.post.restore()

  it 'should POST to /gadgets/:id/status', (done) ->
    status '123X', options, ->
      needle.post.getCall(0).args[0].should.match /\/gadgets\/123X\/status$/
      done()

  it 'should respect the catalog in options', (done) ->
    status '123X', options, ->
      needle.post.getCall(0).args[1].catalog.should.eq 'approved'
      done()

  it 'should hide gadget, if --hidden is specified', (done) ->
    status '123X', _.extend(_.clone(options), {hidden: true }), ->
      needle.post.getCall(0).args[1].hidden.should.be.true
      done()