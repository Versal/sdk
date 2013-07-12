fs = require 'fs'
path = require 'path'
require('chai').should()
sdk = require '../src/sdk'

gadgetPath = path.resolve './temp/gadgets'

describe 'Compress', ->
  before (done) ->
    sdk.create "#{gadgetPath}/g6", -> done()

  it 'should not contain zip file before running compress', ->
    fs.existsSync("#{gadgetPath}/g6/bundle.zip").should.be.false

  describe 'in gadget directory', ->
    before (done) ->
      sdk.compress "#{gadgetPath}/g6", -> done()

    it 'should exist', ->
      fs.existsSync("#{gadgetPath}/g6/bundle.zip").should.be.true

  describe 'non-existent directory', ->
    it 'should callback with error', (done) ->
      dir = path.resolve('./test/fixtures/compress/non-existent')
      sdk.compress dir, (err) ->
        err.message.should.match /does not exist/
        done()
