_ = require 'underscore'
request = require 'supertest'
sinon = require 'sinon'
fs = require 'fs-extra'
path = require 'path'
Api = require '../src/local-api/index'

describe 'Local API', ->
  api = null
  data =
    manifests: [{ id: 1, username: 'am', name: 'foo', version: '1' }]
    assets: []
    representations: {}
    course: {
      id: 'local',
      title: 'test'
      lessons: [{
        id: '1',
        title: 'First lesson',
        gadgets: []
        }]
    }

  before ->
    api = Api data

  describe 'sandbox', ->
    it 'upload', (done) ->
      # 404 is OK for now
      request(api).put('/sandbox').send({ id: 1 }).expect 404, done

  describe 'courses', ->
    it 'show', (done) ->
      request(api).get('/courses/local').expect 200, done

    it 'update', (done) ->
      request(api).put('/courses/local').send(title: 'foo').expect 200, done

    it 'start', (done) ->
      request(api).post('/courses/local/start').expect 200, done

    it 'show progress', (done) ->
      request(api).get('/courses/local/progress').expect 200, done

    it 'update progress', (done) ->
      request(api).put('/courses/local/progress').send(lesson: 2).expect 200, done

  describe 'lessons', ->
    lessons = null
    newLessonId = null

    before ->
      lessons = -> data.course.lessons

    it '404', (done) ->
      request(api).get('/courses/local/lessons/0').expect 404, done

    it 'index', (done) ->
      request(api).get('/courses/local/lessons')
        .expect 200, lessons(), done

    it 'show', (done) ->
      request(api).get('/courses/local/lessons/1')
        .expect 200, _.findWhere(lessons(), { id: "1" }), done

    it 'create', (done) ->
      request(api).post('/courses/local/lessons')
        .send(title: 'Lesson 2')
        .expect 201, (err) ->
          if err then return done err
          lessons().length.should.eq 2
          newLessonId = lessons()[1].id
          done()

    it 'update', (done) ->
      request(api).put('/courses/local/lessons/1')
        .send(title: 'Updated lesson 1')
        .expect 200, (err, res) ->
          if err then return done err
          res.body.should.eql lessons()[0]
          done()

    it 'destroy', (done) ->
      request(api).del('/courses/local/lessons/' + newLessonId)
        .expect 200, (err, res) ->
          if err then return done err
          lessons().length.should.eq 1
          done()

  describe 'gadgets', ->
    gadgets = null
    newGadgetId = null

    before ->
      gadgets = -> data.course.lessons[0].gadgets

    it '404', (done) ->
      request(api).get('/courses/local/lessons/1/gadgets/0')
        .expect 404, done

    it 'create', (done) ->
      request(api).post('/courses/local/lessons/1/gadgets')
        .send(type: 'versal/image@0.7.3')
        .expect 201, (err, res) ->
          if err then return done err
          res.body.id.should.be.ok
          newGadgetId = res.body.id
          gadgets().length.should.eq 1
          done()

    it 'index', (done) ->
      request(api).get('/courses/local/lessons/1/gadgets')
        .expect 200, gadgets(), done

    it 'show', (done) ->
      request(api).get('/courses/local/lessons/1/gadgets/' + newGadgetId)
        .expect 200, done

    it 'updates config values', (done) ->
      request(api).put('/courses/local/lessons/1/gadgets/' + newGadgetId + '/config')
        .send(content: 'Updated content')
        .expect 200, (err, res) ->
          if err then return done err
          res.body.content.should.eq 'Updated content'
          res.body.should.eql gadgets()[0].config
          done()

    it 'removes config values', (done) ->
      request(api).put('/courses/local/lessons/1/gadgets/' + newGadgetId + '/config')
        .send(anotherKey: 'Something else')
        .expect 200, (err, res) ->
          if err then return done err
          gadgets()[0].config.hasOwnProperty('content').should.be.false
          done()

    it 'updates userstate values', (done) ->
      request(api).put('/courses/local/lessons/1/gadgets/' + newGadgetId + '/userstate')
        .send(x: 73)
        .expect 200, (err, res) ->
          if err then return done err
          res.body.x.should.eq 73
          res.body.should.eql gadgets()[0].userState
          done()

    it 'removes userstate values', (done) ->
      request(api).put('/courses/local/lessons/1/gadgets/' + newGadgetId + '/userstate')
        .send(anotherKey: 'Something else')
        .expect 200, (err, res) ->
          if err then return done err
          gadgets()[0].userState.hasOwnProperty('x').should.be.false
          done()

    it 'destroy', (done) ->
      request(api).del('/courses/local/lessons/1/gadgets/' + newGadgetId)
        .expect 200, (err, res) ->
          if err then return done err
          gadgets().length.should.eq 0
          done()

  describe 'assets', ->
    assets = filePath = fileSize = null

    before ->
      filePath = './test/fixtures/education.jpg'
      fileSize = fs.statSync(filePath).size
      assets = data.assets

    it 'create', (done) ->
      request(api).post('/assets')
        .attach('content', filePath)
        .field('title', 'New asset')
        .send()
        .expect 201, (err, res) ->
          if err then return done err
          asset = assets[0]
          rep = asset.representations[0]
          fs.existsSync(data.representations[rep.id]).should.be.true
          done()

    # get asset metadata
    it 'show', (done) ->
      request(api).get('/assets/' + assets[0].id)
        .expect 200, assets[0], done

    # get asset representation
    it 'download', (done) ->
      request(api).get('/assets/' + assets[0].representations[0].id)
        .expect('content-length', fileSize.toString())
        .expect 200, done

  describe 'manifests', ->
    it 'index', (done) ->
      request(api).get('/manifests')
        .expect 200, data.manifests, done

    it 'legacy index', (done) ->
      request(api).get('/gadgets')
        .send({ user: 'me', catalog: 'sandbox' })
        .expect 200, done
