require('chai').should()
_ = require 'underscore'
fs = require 'fs-extra'
parse = require '../src/course/parse'
path = require 'path'
dir = path.resolve './test/fixtures/cml'
dest = path.resolve './temp/cml'

describe 'CML parse', ->
  before (done) ->
    parse.command dir, dest: dest, done

  describe 'course.json', ->
    it 'should exist', ->
      fs.existsSync(path.join(dest, 'course.json')).should.be.true

    it 'should contain two lessons', ->
      course = require path.join(dest, 'course.json')
      course.lessons.length.should.eq 2

  describe 'assets.json', ->
    it 'should exist', ->
      fs.existsSync(path.join(dest, 'local_assets.json')).should.be.true

    it 'should contain two lessons', ->
      assets = require path.join(dest, 'local_assets.json')
      _.keys(assets).length.should.eq 2
