require('chai').should()
path = require 'path'
sdk = require '../src/sdk'
sinon = require 'sinon'

gadgetPath = path.resolve './test/fixtures/upload'

# TODO: Fix this test
describe.skip 'Upload', ->
  before (done) ->
    callback = sinon.spy()
    sdk.upload gadgetPath, sessionId: '3a80c8bb-1405-4b33-ac77-28ca6896eafb', (err, manifest) ->
      if err then throw err
      callback err, manifest
      done()

  it 'should call ajax', ->
    callback.called.should.be.true