require('chai').should()
path = require 'path'
upload = require '../src/course/upload'
needle = require 'needle'
sinon = require 'sinon'
fs = require 'fs-extra'

newCoursePath = path.resolve './test/fixtures/cml/upload/new_course'
existingCoursePath = path.resolve './test/fixtures/cml/upload/existing_course'

describe 'Course upload', ->
  describe 'post', ->
    options = { apiUrl: 'http://api', sessionId: 'X123' }

    beforeEach ->
      sinon.stub(needle, 'request').callsArgWith 4, null, { statusCode: 200 }, { id: 73 }
      sinon.stub fs, 'outputJsonSync'
      sinon.stub upload, 'replaceAssets'

    afterEach ->
      needle.request.restore()
      fs.outputJsonSync.restore()
      upload.replaceAssets.restore()

    describe 'new course', ->
      beforeEach (done) ->
        upload.command newCoursePath, options, done

      it 'should POST to /courses/', ->
        needle.request.getCall(0).args[0].should.eq 'post'
        needle.request.getCall(0).args[1].should.eq 'http://api/courses/'

      it 'should save id of uploaded course', ->
        fs.outputJsonSync.firstCall.args[1].should.eql { id: 73 }

      it 'should not replace assets', ->
        upload.replaceAssets.called.should.be.false

    describe 'existing course', ->
      beforeEach (done) ->
        upload.command existingCoursePath, options, done

      it 'should PUT to /courses/:id', ->
        needle.request.getCall(0).args[0].should.eq 'post'
        needle.request.getCall(0).args[1].should.eq 'http://api/courses/'

      it 'should save id of uploaded course', ->
        fs.outputJsonSync.called.should.be.false

      it 'should replace assets', ->
        upload.replaceAssets.called.should.be.true
