should = require('chai').should()
sdk = require '../src/sdk'

describe 'SDK', ->
  it 'should detect gadget', ->
    sdk.detect('./test/fixtures/detect/gadget').should.eq 'gadget'

  it 'should detect course', ->
    sdk.detect('./test/fixtures/detect/course').should.eq 'course'

  it 'should not detect anything', ->
    should.not.exist sdk.detect('./test/fixtures/detect')