_ = require 'underscore'
request = require 'supertest'
sinon = require 'sinon'
fs = require 'fs-extra'
path = require 'path'

Bridge = require '../src/bridge/bridge'
courseJson = require './fixtures/bridge/course.json'
gadgetPath = path.resolve './test/fixtures/bridge/gadget/dist'
assetsPath = path.resolve './test/fixtures/bridge/local_assets.json'
assetsJson = require assetsPath

# run bridge on port 3073 for tests
baseUrl = 'http://localhost:3073'
baseDir = path.resolve './temp/bridge'

# convenience wrapper over api urls
apiUrl = (endpoint) ->
  if endpoint.indexOf('/') == 0 then endpoint = endpoint.slice 1
  return "#{baseUrl}/api/#{endpoint}"

describe 'Bridge internals', ->
  bridge = null

  describe 'link gadget', ->
    project = null

    before ->
      bridge = new Bridge
      project = bridge.linkGadget gadgetPath

    it 'should assign id', ->
      project.id.should.be.ok

    it 'should add gadget project to datastore', ->
      bridge.data.projects.length.should.eq 1

  describe 'link assets', ->
    before ->
      bridge = new Bridge
      bridge.linkAssets assetsPath

    it 'should add asset to datastore', ->
      bridge.data.assets.length.should.eq 1

describe 'Bridge HTTP API', ->
  bridge = null

  before ->
    fs.mkdirsSync "#{baseDir}/versal_data/assets"

  # get a clean copy of the bridge for each test
  beforeEach ->
    bridge = new Bridge { baseDir }
    bridge.start port: 3073

  afterEach ->
    bridge.stop()

  it 'index (empty bridge)', (done) ->
    request(bridge.site).get('/').expect 404, done

  it 'index (with course)', (done) ->
    # course is required for index to work
    bridge.data.courses.add { id: 1 }
    request(bridge.site).get('/').expect 200, done

  it 'rewrite styles/assets', (done) ->
    request(bridge.site).get('/styles/assets/font/fontawesome-webfont.eot').expect 200, done

  it 'version', (done) ->
    pkg = require '../package.json'
    request(bridge.api).get('/version').expect(200, "bridge-#{pkg.version}", done)

  describe 'resources', ->
    course = null

    beforeEach ->
      bridge.data.courses.add _.clone courseJson
      course = bridge.data.courses.get(1)
      sinon.spy course, 'save'

    afterEach ->
      course.save.restore()

    describe 'courses', ->
      it '404', (done) ->
        request(bridge.api).get('/courses/0').expect 404, done

      it 'show', (done) ->
        request(bridge.api).get('/courses/1').expect 200, course.toJSON(lessons: true, gadgets: true), done

      it 'update', (done) ->
        request(bridge.api).put('/courses/1').send(title: 'Updated title')
          .expect 200, (err, res) ->
            if err then return done err
            res.body.title.should.eq 'Updated title'
            res.body.should.eql course.toJSON()
            course.save.called.should.be.true
            done()

    describe 'progress', ->
      progress = null

      beforeEach ->
        progress = course.progress

      it 'show', (done) ->
        request(bridge.api).get('/courses/1/progress').expect 200, progress.toJSON(), done

      it 'update', (done) ->
        request(bridge.api).put('/courses/1/progress').send(lesson: 2)
          .expect 200, (err, res) ->
            if err then return done err
            res.body.lesson.should.eq 2
            res.body.should.eql progress.toJSON()
            course.save.called.should.be.true
            done()

    describe 'lessons', ->
      lessons = null

      beforeEach ->
        # initial length of lessons in fixtures is 2
        lessons = course.lessons

      it '404', (done) ->
        request(bridge.api).get('/courses/1/lessons/0').expect 404, done

      it 'index', (done) ->
        request(bridge.api).get('/courses/1/lessons')
          .expect 200, lessons.toJSON(gadgets: true), done

      it 'show', (done) ->
        request(bridge.api).get('/courses/1/lessons/1')
          .expect 200, lessons.get(1).toJSON(gadgets:true), done

      it 'create', (done) ->
        request(bridge.api).post('/courses/1/lessons')
          .send(title: 'Lesson 3')
          .expect 201, (err) ->
            if err then return done err
            lessons.length.should.eq 3
            course.save.called.should.be.true
            done()

      it 'update', (done) ->
        request(bridge.api).put('/courses/1/lessons/1')
          .send(title: 'Updated lesson 1')
          .expect 200, (err, res) ->
            if err then return done err
            res.body.title.should.eq 'Updated lesson 1'
            res.body.should.eql lessons.get(1).toJSON(gadgets: true)
            course.save.called.should.be.true
            done()

      it 'destroy', (done) ->
        request(bridge.api).del('/courses/1/lessons/1')
          .expect 200, (err, res) ->
            if err then return done err
            lessons.length.should.eq 1
            course.save.called.should.be.true
            done()

    describe 'gadgets', ->
      gadgets = null

      beforeEach ->
        # initial length of gadgets in fixtures is 2
        gadgets = course.lessons.get(1).gadgets

      it '404', (done) ->
        request(bridge.api).get('/courses/1/lessons/1/gadgets/0')
          .expect 404, done

      it 'index', (done) ->
        request(bridge.api).get('/courses/1/lessons/1/gadgets')
          .expect 200, gadgets.toJSON(), done

      it 'show', (done) ->
        request(bridge.api).get('/courses/1/lessons/1/gadgets/1')
          .expect 200, gadgets.get(1).toJSON(), done

      it 'create', (done) ->
        request(bridge.api).post('/courses/1/lessons/1/gadgets')
          .send(type: 'versal/image@0.7.3')
          .expect 201, (err, res) ->
            if err then return done err
            res.body.id.should.be.ok
            gadgets.length.should.eq 3
            course.save.called.should.be.true
            done()

      it 'destroy', (done) ->
        request(bridge.api).del('/courses/1/lessons/1/gadgets/1')
          .expect 200, (err, res) ->
            if err then return done err
            gadgets.length.should.eq 1
            course.save.called.should.be.true
            done()

      describe 'config', ->
        it 'updates config values', (done) ->
          request(bridge.api).put('/courses/1/lessons/1/gadgets/1/config')
            .send(content: 'Updated content')
            .expect 200, (err, res) ->
              if err then return done err
              res.body.content.should.eq 'Updated content'
              res.body.should.eql gadgets.get(1).config.toJSON()
              course.save.called.should.be.true
              done()

        it 'removes config values', (done) ->
          request(bridge.api).put('/courses/1/lessons/1/gadgets/1/config')
            .send(anotherKey: 'Something else')
            .expect 200, (err, res) ->
              if err then return done err
              gadgets.get(1).config.has('content').should.be.false
              course.save.called.should.be.true
              done()

      it 'update userstate', (done) ->
        request(bridge.api).put('/courses/1/lessons/1/gadgets/1/userstate')
          .send(x: 73)
          .expect 200, (err, res) ->
            if err then return done err
            res.body.x.should.eq 73
            res.body.should.eql gadgets.get(1).userState.toJSON()
            course.save.called.should.be.true
            done()

  describe 'assets', ->
    assets = filePath = fileSize = null

    before ->
      filePath = './test/fixtures/bridge/education.jpg'
      fileSize = fs.statSync(filePath).size

    beforeEach ->
      bridge.data.assets.add _.clone assetsJson
      assets = bridge.data.assets
      sinon.stub assets, 'save'

    afterEach ->
      assets.save.restore()

    it 'index', (done) ->
      request(bridge.api).get('/assets')
        .expect 200, assets.toJSON(representations: true), done

    # get asset metadata
    it 'show', (done) ->
      request(bridge.api).get('/assets/1')
        .expect 200, assets.get(1).toJSON(representations: true), done

    # get asset representation
    it 'download', (done) ->
      request(bridge.api).get('/assets/1/0')
        .expect('content-length', fileSize.toString())
        .expect 200, done

    it 'create', (done) ->
      request(bridge.api).post('/assets')
        .attach('content', filePath)
        .field('title', 'New asset')
        .send()
        .expect 201, (err, res) ->
          if err then return done err
          asset = assets.get(res.body.id)
          rep = asset.representations.at(0)
          # had to violate "one assertion per test" principle, because
          # "beforeEach" resets bridge before every assertion
          rep.get('contentType').should.eq 'image/jpeg'
          rep.get('location').should.eq "/assets/#{res.body.id}/0"
          asset.get('_path').should.eq "#{baseDir}/versal_data/assets/#{res.body.id}"
          fs.existsSync(asset.get('_path')).should.be.true
          assets.save.called.should.be.true
          done()

  describe 'gadget projects', ->
    project = null

    beforeEach ->
      project = bridge.linkGadget gadgetPath

    describe 'paths', ->
      it 'should serve gadget manifest', (done) ->
        request(bridge.api).get(project.manifest())
          .expect 200, project.toJSON(), done

      it 'should serve gadget.js', (done) ->
        request(bridge.api).get(project.main())
          .expect('content-type', 'application/javascript')
          .expect 200, done

      it 'should serve gadget.css', (done) ->
        request(bridge.api).get(project.css())
          .expect('content-type', 'text/css; charset=UTF-8')
          .expect 200, done

      it 'should serve icon.png', (done) ->
        request(bridge.api).get(project.icon())
          .expect('content-length', '2696')
          .expect('content-type', 'image/png')
          .expect 200, done

    describe 'legacy paths', ->
      gadgetUrl = null
      beforeEach ->
        gadgetUrl = "/gadgets/#{project.id}"

      it 'should serve gadget manifest', (done) ->
        request(bridge.api).get("#{gadgetUrl}")
          .expect 200, project.toJSON(), done

      it 'should serve gadget.js', (done) ->
        request(bridge.api).get("#{gadgetUrl}/gadget.js")
          .expect('content-type', 'application/javascript')
          .expect 200, done

      it 'should serve gadget.css', (done) ->
        request(bridge.api).get("#{gadgetUrl}/gadget.css")
          .expect('content-type', 'text/css; charset=UTF-8')
          .expect 200, done

      it 'should serve icon.png', (done) ->
        request(bridge.api).get("#{gadgetUrl}/assets/icon.png")
          .expect('content-length', '2696')
          .expect('content-type', 'image/png')
          .expect 200, done

    describe 'sandbox', ->
      it 'should fetch gadgets', (done) ->
        request(bridge.api).get("/gadgets").send({ user: 'me', catalog: 'sandbox' })
          .expect 200, bridge.data.projects.toJSON(), done
