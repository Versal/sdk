_ = require 'underscore'
require('chai').should()
path = require 'path'
upload = require '../src/course/upload'
needle = require 'needle'
sinon = require 'sinon'
fs = require 'fs-extra'

newCoursePath = path.resolve './test/fixtures/cml/upload/new_course'
existingCoursePath = path.resolve './test/fixtures/cml/upload/existing_course'

describe 'Course upload', ->
  options = { apiUrl: 'http://api', sessionId: 'X123' }

  beforeEach ->
    sinon.stub(needle, 'request').callsArgWith 4, null, { statusCode: 200 }, { id: 73 }
    sinon.stub fs, 'outputJsonSync'
    sinon.stub(upload, 'replaceAssets').returnsArg 0

  afterEach ->
    needle.request.restore()
    fs.outputJsonSync.restore()
    upload.replaceAssets.restore()

  describe 'course metadata', ->
    it 'should not upload when course title is not set', (done) ->
      opts = _.extend _.clone(options), meta: {}
      upload.command newCoursePath, opts, (err) ->
        err.should.match /Title of the course is not specified/
        needle.request.called.should.be.false
        done()

  describe 'new course', ->
    beforeEach (done) ->
      upload.command newCoursePath, options, done

    it 'should delete id from course.json', ->
      needle.request.getCall(0).args[2].should.not.have.property 'id'

    it 'should extend versal_data/course.json with course.json', ->
      needle.request.getCall(0).args[2].title.should.eq 'New course'

    it 'should POST to /courses/', ->
      needle.request.getCall(0).args[0].should.eq 'post'
      needle.request.getCall(0).args[1].should.eq 'http://api/courses/'

    it 'should save id of uploaded course', ->
      fs.outputJsonSync.firstCall.args[1].id.should.eq 73

    it 'should not replace assets', ->
      upload.replaceAssets.called.should.be.false

  describe 'existing course', ->
    beforeEach (done) ->
      upload.command existingCoursePath, options, done

    it 'should use id from course.json', ->
      needle.request.getCall(0).args[2].id.should.eq 'X1Y2Z3'

    it 'should extend versal_data/course.json with course.json', ->
      needle.request.getCall(0).args[2].title.should.eq 'Existing course'
      needle.request.getCall(0).args[2].shortDesc.should.eq 'Short description'

    it 'should PUT to /courses/:id', ->
      needle.request.getCall(0).args[0].should.eq 'put'
      needle.request.getCall(0).args[1].should.eq 'http://api/courses/X1Y2Z3'

    it 'should not save id of uploaded course', ->
      fs.outputJsonSync.called.should.be.false

    it 'should replace assets', ->
      upload.replaceAssets.called.should.be.true
