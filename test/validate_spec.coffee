validate = require '../../lib/validate/validate'

describe 'Validate', ->
  describe 'valid manifest', ->
    before ->
      manifest =
        name: 'foo-gadget'
        version: '0.1.2'
        description: 'Foo gadget.'
      @errors = validate.validateManifest manifest
    
    it 'should return no errors', ->
      @errors.length.should.equal 0

  describe 'invalid manifest', ->
    before ->
      manifest =
        name: 'foo gadget'
        version: 'latest'
      @errors = validate.validateManifest manifest

    it 'should return errors', ->
      @errors.length.should.equal 3
