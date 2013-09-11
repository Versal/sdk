should = require('chai').should()
request = require 'superagent'
fs = require 'fs-extra'
path = require 'path'
sdk = require '../src/sdk'
Bridge = require '../src/bridge/bridge'
sinon = require 'sinon'
pkg = require '../package.json'

helper =
  url: "http://localhost:3073"
  port: 3073

  getApiUrl: (endpoint) ->
    if endpoint.indexOf('/') == 0 then endpoint = endpoint.slice 1
    return "#{@url}/api/#{endpoint}"

  getFixture: (fixture) ->
    return JSON.parse fs.readFileSync "./player/fixtures/#{fixture}.json", 'utf-8'

describe 'Bridge', ->
  bridge = null
  uploadDir = path.resolve './temp/bridge/versal_data/assets'

  before ->
    fs.mkdirsSync uploadDir
    # FIXME: Provide path to "cwd" - current folder, to where bridge is pointed
    bridge = new Bridge { uploadDir }
    bridge.start helper.port

  after ->
    bridge.stop()

  it 'should set correct apiUrl', ->
    helper.getApiUrl('whatever').should.eq "http://localhost:3073/api/whatever"

  it 'should return index', (done) ->
    request.get(helper.url).end (res) ->
      res.ok.should.be.ok
      done()

  it 'should return empty progress', (done) ->
    request.get(helper.getApiUrl('courses/1/progress')).end (res) ->
      res.body.should.eql {}
      done()

  it 'should return version', (done) ->
    request.get(helper.getApiUrl('version')).end (res) ->
      res.statusCode.should.eq 200
      res.text.should.eq "bridge-#{pkg.version}"
      done()

  describe 'users', ->
    response = null

    describe 'POST', ->
      before (done) ->
        user =
          username: 'am'
        request.post(helper.getApiUrl('users'))
          .send(user)
          .end (err, res) ->
            response = res
            done()

      it 'should return 201', ->
        response.statusCode.should.eq 201

      it 'should return an id', ->
        response.body.id.should.be.ok

      it 'should add user to bridge.users', ->
        bridge.users.length.should.eq 1

    describe 'signin', ->
      before (done) ->
        userId = bridge.users[0].id
        request.post(helper.getApiUrl("signin/#{userId}"))
          .send(null)
          .end (err, res) ->
            response = res
            done()

      it 'should return 201', ->
        response.statusCode.should.eq 201

      it 'should return sessionId', ->
        response.body.sessionId.should.be.ok

      it 'should add session to bridge.sessions', ->
        bridge.sessions.length.should.eq 1

  describe 'course', ->
    it 'should serve course.json from player/fixtures folder', (done) ->
      request.get(helper.getApiUrl('courses/1')).end (res) ->
        res.body.should.eql helper.getFixture 'course'
        done()

    it 'should serve lessons', (done) ->
      request.get(helper.getApiUrl('courses/1/lessons')).end (res) ->
        res.body.length.should.eq 2
        done()

    it 'should serve lesson', (done) ->
      request.get(helper.getApiUrl('courses/1/lessons/1')).end (res) ->
        res.body.id.should.eq 1
        done()

    describe 'PUT', ->
      it 'should update title', (done) ->
        request.put(helper.getApiUrl('courses/1'))
          .send(title: 'Updated course title')
          .end (res) ->
            res.statusCode.should.eq 200
            bridge.course.get('title').should.eq 'Updated course title'
            done()


  # Currently bridge allows only one linked coourse at a time
  # It returns that course regardless of courseId
  # TODO: Enable these tests when courseId is back to work
  describe.skip 'non-existing course', ->
    it 'should return 404', (done) ->
      request.get(helper.getApiUrl('courses/unknown')).end (res) ->
        res.status.should.eq 404
        done()

    it 'should return 404 for lessons', (done) ->
      request.get(helper.getApiUrl('courses/unknown/lessons')).end (res) ->
        res.status.should.eq 404
        done()

    it 'should return 404 for lesson', (done) ->
      request.get(helper.getApiUrl('courses/unknown/lessons/unknown')).end (res) ->
        res.status.should.eq 404
        done()

  describe 'editing', ->
    response = null

    describe 'lessons', ->
      describe 'POST', ->
        before (done) ->
          sinon.stub bridge, 'saveCourse'
          request.post(helper.getApiUrl('courses/1/lessons'))
            .send({ title: 'Lesson 3'})
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 201', ->
          response.statusCode.should.eq 201

        it 'should assign id to new lesson', ->
          response.body.id.should.be.ok

        it 'should add lesson to the course', ->
          bridge.course.lessons.get(response.body.id).should.exist

        it 'should set title', ->
          bridge.course.lessons.get(response.body.id).get('title').should.eq 'Lesson 3'

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

      describe 'PUT', ->
        before (done) ->
          data =
            id: 'l_1'
            title: 'Lesson 3'

          bridge.course.lessons.add data
          sinon.stub bridge, 'saveCourse'

          request.put(helper.getApiUrl('courses/1/lessons/l_1'))
            .send(title: 'Lesson 73')
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 200', ->
          response.statusCode.should.eq 200

        it 'should update gadget config', ->
          bridge.course.lessons.get('l_1').get('title').should.eq 'Lesson 73'

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

      describe 'DELETE', ->
        before (done) ->
          data =
            id: 'l_2'
            title: 'Lesson 4'

          bridge.course.lessons.add data
          sinon.stub bridge, 'saveCourse'

          request.del(helper.getApiUrl('courses/1/lessons/l_2'))
            .send()
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 200', ->
          response.statusCode.should.eq 200

        it 'should delete gadget', ->
          should.not.exist bridge.course.lessons.get('l_2')

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

    describe 'gadgets', ->
      describe 'POST', ->
        before (done) ->
          bridge.course.lessons.add { id: 'l_0', title: 'Lesson for gadgets' }

          data =
            type: 'versal/text@0.1.0'
            config: { x: 73 }
          sinon.stub bridge, 'saveCourse'

          request.post(helper.getApiUrl('courses/1/lessons/l_0/gadgets'))
            .send(data)
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 201', ->
          response.statusCode.should.eq 201

        it 'should assign id to new gadget', ->
          response.body.id.should.be.ok

        # FIXME: Revise the amount of gadgets
        it 'should add gadget to lesson', ->
          bridge.course.lessons.get('l_0').gadgets.length.should.eq 1

        it 'should set gadget config properties', ->
          bridge.course.lessons.get('l_0').gadgets.get(response.body.id).config.get('x').should.eq 73

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

      describe 'PUT', ->
        before (done) ->
          data =
            id: 'g_1'
            type: 'versal/text@0.1.0'
            config: { x: 73 }

          bridge.course.lessons.get('l_0').gadgets.add data
          sinon.stub bridge, 'saveCourse'

          request.put(helper.getApiUrl('courses/1/lessons/l_0/gadgets/g_1/config'))
            .send(x: 100)
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 200', ->
          response.statusCode.should.eq 200

        it 'should update gadget config', ->
          bridge.course.lessons.get('l_0').gadgets.get('g_1').config.get('x').should.eq 100

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

      describe 'DELETE', ->
        before (done) ->
          data =
            id: 'g_2'
            type: 'versal/text@0.1.0'
            config: { x: 73 }

          bridge.course.lessons.get(1).gadgets.add data
          sinon.stub bridge, 'saveCourse'

          request.del(helper.getApiUrl('courses/1/lessons/1/gadgets/g_2'))
            .send()
            .end (res) ->
              response = res
              done()

        after ->
          bridge.saveCourse.restore()

        it 'should respond with 200', ->
          response.statusCode.should.eq 200

        it 'should delete gadget', ->
          should.not.exist bridge.course.lessons.get('l_0').gadgets.get('g_2')

        it 'shoud save course', ->
          bridge.saveCourse.called.should.be.true

  describe 'assets', ->
    status = asset = null

    describe 'POST', ->
      fileSize = 0

      before (done) ->
        filePath = path.resolve './test/fixtures/bridge/education.jpg'
        fileSize = fs.statSync(filePath).size
        request.post(helper.getApiUrl('assets'))
          .attach('content', filePath)
          .field('title', 'New file')
          .send()
          .end (res) ->
            status = res.statusCode
            asset = res.body
            done()

      it 'should respond with 201', ->
        status.should.eq 201

      it 'should have id', ->
        asset.id.should.be.ok

      it 'should store asset in bridge.assets', ->
        bridge.assets.get(asset.id).should.exist

      it 'should have representations', ->
        asset.representations.length.should.be.ok

      it 'should set contentType of representations', ->
        asset.representations[0].contentType.should.eq 'image/jpeg'

      it 'should be available for re-fetching', (done) ->
        url = helper.getApiUrl "/assets/#{asset.id}"
        request.get(url).end (res) ->
          res.statusCode.should.eq 200
          res.body.should.have.property 'representations'
          done()

      it 'should save file in uploadDir', ->
        fs.existsSync("#{uploadDir}/#{asset.id}").should.be.true

      it 'should return representation when requested', (done) ->
        url = helper.getApiUrl asset.representations[0].location
        request.get(url).end (res) ->
          res.statusCode.should.eq 200
          res.header['content-length'].should.eq fileSize.toString()
          done()

  describe 'gadget pojects', ->
    gadgets = addGadget = response = null
    gadgetPath = path.resolve './test/fixtures/bridge/gadget/dist'

    describe 'POST', ->
      before (done) ->
        addGadget = sinon.spy bridge, 'addGadget'
        request.post(helper.getApiUrl('gadgets')).send(path: gadgetPath).end (res) ->
          response = res
          done()

      after ->
        addGadget.restore()

      it 'should return 201', ->
        response.statusCode.should.eq 201

      it 'should call addGadget', ->
        addGadget.firstCall.args[0].should.eq gadgetPath

      it 'response should appear to be a gadget manifest', ->
        response.body.should.have.property 'username'
        response.body.should.have.property 'name'
        response.body.should.have.property 'version'

    describe 'sandbox', ->
      it 'should fetch gadgets', (done) ->
        params =
          user: 'me'
          catalog: 'sandbox'
        request.get(helper.getApiUrl('gadgets')).send(params).end (res) =>
          res.statusCode.should.eq 200
          res.body.length.should.eq 1
          done()

    describe 'paths', ->
      gadgetUrl = gadget = null

      before ->
        gadget = bridge.gadgets[0]

      it 'should serve gadget manifest', (done) ->
        url = helper.getApiUrl gadget.manifest()
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()

      it 'should serve gadget.js', (done) ->
        url = helper.getApiUrl gadget.main()
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()

      it 'should serve gadget.css', (done) ->
        url = helper.getApiUrl gadget.css()
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()

      it 'should serve icon.png', (done) ->
        url = helper.getApiUrl gadget.icon()
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()

    describe 'legacy paths', ->
      gadgetUrl = manifest = null

      before ->
        manifest = bridge.gadgets[0]
        gadgetUrl = "api/gadgets/#{manifest.id}"

      it 'manifest should contain id', ->
        manifest.id.should.be.ok

      it 'should serve gadget files from /gadgets/:id folder', (done) ->
        url = "#{helper.url}/#{gadgetUrl}/gadget.js"
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()

      it 'should serve gadget assets from /gadgets/:id/assets', (done) ->
        url = "#{helper.url}/#{gadgetUrl}/assets/icon.png"
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()