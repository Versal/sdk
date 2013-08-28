require('chai').should()
request = require 'superagent'
fs = require 'fs'
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

  before ->
    bridge = new Bridge
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

  describe 'assets', ->

    it 'approved catalog should be empty', (done) ->
      params =
        user: 'me'
        catalog: 'approved'
      request.get(helper.getApiUrl('gadgets')).send(params).end (res) ->
        res.body.should.eql []
        done()

    it 'pending catalog should be empty', (done) ->
      params =
        user: 'me'
        catalog: 'pending'
      request.get(helper.getApiUrl('gadgets')).send(params).end (res) ->
        res.body.should.eql []
        done()

  describe 'gadgets', ->
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