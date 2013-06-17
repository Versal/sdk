require('chai').should()
path = require 'path'
sdk = require '../../lib/sdk'
sinon = require 'sinon'

gadgetPath = path.resolve './test/fixtures/upload'
return false
describe 'Upload', ->
  before (done) ->
    callback = @callback = sinon.spy()
    sdk.upload gadgetPath, sessionId: '3a80c8bb-1405-4b33-ac77-28ca6896eafb', (err) ->
      callback(err)
      done()

  it 'should call ajax', ->
    @callback.called.should.be.true