should = require('chai').should()
sdk = require '../src/sdk'
path = require 'path'
validate = require '../src/validate/validate'
sinon = require 'sinon'

describe 'Validate', ->
  describe 'valid manifest', ->
    errors = []

    before ->
      manifest =
        name: 'foo-gadget'
        version: '0.1.2'
        description: 'Foo gadget.'
      errors = validate.validateManifest manifest

    it 'should return no errors', ->
      errors.length.should.equal 0

  describe 'invalid manifest', ->
    errors = []

    before ->
      manifest =
        name: 'foo gadget'
        version: 'latest'
      errors = validate.validateManifest manifest

    it 'should return errors', ->
      errors.length.should.equal 3

  describe 'valid files', ->
    errors = []

    before ->
      files = ["manifest.json", "gadget.js", "gadget.css", "assets/icon.png", "assets/asset.png", "scripts/dependent.js"]
      errors = validate.validateFiles files

    it 'should return no errors', ->
      errors.length.should.equal 0

  describe 'invalid files', ->
    errors = []

    before ->
      errors = validate.validateFiles []

    it 'should return errors', ->
      errors.length.should.eq 4

  describe 'created gadget', ->
    callback = sinon.spy()

    before (done) ->
      gadgetPath = path.resolve "./temp/gadgets/validate_gadget"
      sdk.create gadgetPath, =>
        sdk.validate gadgetPath, (err) =>
          callback(err)
          done()

    it 'should call callback without errors', ->
      callback.called.should.be.true

    it 'should not return any errors', ->
      should.not.exist(callback.firstCall.args[0])
