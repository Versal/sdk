should = require('chai').should()
sdk = require '../src/sdk'
needle = require 'needle'
sinon = require 'sinon'

describe 'SDK', ->
  describe 'detect', ->
    it 'should detect gadget', ->
      sdk.detect('./test/fixtures/detect/gadget').should.eq 'gadget'

    it 'should detect course', ->
      sdk.detect('./test/fixtures/detect/course').should.eq 'course'

    it 'should not detect anything', ->
      should.not.exist sdk.detect('./test/fixtures/detect')

  describe 'callback parameters', ->
    beforeEach ->
      sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 201 }, { id: '1' })

    afterEach ->
      needle.post.restore()

    it 'should pass body to callback', (done) ->
      sdk.upload './test/fixtures/upload', {}, (err, body) ->
        body.should.eql [id: '1']
        done()