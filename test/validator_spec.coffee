restapi = require '../src/restapi'
validator = require '../src/validator'
path = require 'path'
sinon = require 'sinon'
assert = require 'assert'

gadgetProjectDir = path.resolve './test/fixtures/iframe-gadget'

describe 'Validation helper', ->

  describe 'given no other versions', ->
    beforeEach ->
      sinon.stub restapi, 'getGadgetCatalog', (catalog, options, callback) ->
        callback null, {}
    afterEach ->
      restapi.getGadgetCatalog.restore()

    it 'should pass validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, done

  describe 'given an equal version', ->
    beforeEach ->
      sinon.stub restapi, 'getGadgetCatalog', (catalog, options, callback) ->
        callback null, {version: '0.1.0', name: 'iframe-gadget'}
    afterEach ->
      restapi.getGadgetCatalog.restore()

    it 'should fail validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /already exists/.test err.message
        done()

  describe 'given a higher version', ->
    beforeEach ->
      sinon.stub restapi, 'getGadgetCatalog', (catalog, options, callback) ->
        callback null, {version: '0.2.0', name: 'iframe-gadget'}
    afterEach ->
      restapi.getGadgetCatalog.restore()

    it 'should fail validation', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /already exists/.test err.message
        done()

    it 'should suggest the next version', (done) ->
      validator.checkProject gadgetProjectDir, {}, (err) ->
        assert.ok /Bump the version.*0\.2\.1/.test err.message
        done()
