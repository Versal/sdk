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
    bridge = new Bridge port: helper.port
    bridge.start()

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

  describe 'course', ->
    it 'should serve course.json from sdk/fixtures folder', (done) ->
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

  describe 'gadgets', ->
    describe 'initially', ->
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

    describe 'add a gadget', ->
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

      it 'should set files hash on manifest', ->
        gadgets[0].files.should.be.ok

      it 'should serve gadget files from /gadgets/:id folder', (done) ->
        url = "#{helper.url}/gadgets/#{gadgets[0].id}/gadget.js"
        request.get(url).end (res) ->
          res.status.should.eq 200
          done()