restapi = require '../src/restapi'
validator = require '../src/validator'
path = require 'path'
sinon = require 'sinon'
assert = require 'assert'

gadgetProjectDir = path.resolve './test/fixtures/iframe-gadget'

givenUploadedGadgets = (gadgets) ->
    beforeEach ->
      sinon.stub restapi, 'getGadgetCatalog', (catalog, options, callback) ->
        callback null, gadgets
    afterEach ->
      restapi.getGadgetCatalog.restore()

describe 'Validation helper', ->

  describe 'given no other versions', ->
    givenUploadedGadgets {}

    it 'should pass validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, done

  describe 'given an equal version', ->
    givenUploadedGadgets { version: '0.1.0', name: 'iframe-gadget' }

    it 'should fail validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /already exists/.test err.message
        done()

  describe 'given a higher version', ->
    givenUploadedGadgets { version: '0.2.0', name: 'iframe-gadget' }

    it 'should fail validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /already exists/.test err.message
        done()

    it 'should suggest the next version', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /Bump the version.*0\.2\.1/.test err.message
        done()
