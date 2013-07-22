require('chai').should()
request = require 'superagent'
fs = require 'fs'
path = require 'path'
sdk = require '../src/sdk'
Bridge = require '../src/preview/bridge'

helper =
  url: "http://localhost:3073"
  port: 3073

  getApiUrl: (endpoint) ->
    return "#{@url}/api/#{endpoint}"

  getFixture: (fixture) ->
    return JSON.parse fs.readFileSync "./preview/fixtures/#{fixture}.json", 'utf-8'

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
    request.get(helper.getApiUrl('courses/default/progress')).end (res) ->
      res.body.should.eql {}
      done()

  describe 'course', ->
    it 'should serve course.json from sdk/fixtures folder', (done) ->
      request.get(helper.getApiUrl('courses/default')).end (res) ->
        res.body.should.eql helper.getFixture 'course'
        done()

    it 'should serve lessons', (done) ->
      request.get(helper.getApiUrl('courses/default/lessons')).end (res) ->
        res.body.length.should.eq 2
        done()

    it 'should serve lesson', (done) ->
      request.get(helper.getApiUrl('courses/default/lessons/1')).end (res) ->
        res.body.id.should.eq 1
        done()

  describe 'non-existing course', ->
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
    describe 'images', ->
      it 'should fake image assets', (done) ->
        request.get(helper.getApiUrl('assets?tagLead=image')).end (res) ->
          res.body.should.eql helper.getFixture 'assets/images'
          done()

    describe 'videos', ->
      it 'should fake video assets', (done) ->
        request.get(helper.getApiUrl('assets?tagLead=video')).end (res) ->
          res.body.should.eql helper.getFixture 'assets/videos'
          done()

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
    gadgets = null
    gadgetPath = path.resolve './test/fixtures/bridge/gadget/dist'

    before (done) ->
      bridge.addGadget gadgetPath
      params =
        user: 'me'
        catalog: 'approved'
      request.get(helper.getApiUrl('gadgets')).send(params).end (res) =>
        gadgets = res.body
        done()

    it 'should return new gadget from approved', ->
      gadgets.length.should.eq 1

    describe 'paths', ->
      gadgetUrl = manifest = null

      before ->
        manifest = gadgets[0]
        gadgetUrl = "api/gadgets/#{manifest.id}"

      it 'should contain valid icon path', ->
        manifest.icon.should.eq "#{gadgetUrl}/assets/icon.png"

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