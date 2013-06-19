should = require('chai').should()
path = require 'path'
glob = require 'glob'
sdk = require '../lib/sdk'
fs = require 'fs'

gadgetPath = path.resolve './temp/gadgets'

describe 'Create', ->
  before ->
    @templateFiles = glob.sync '**/*.*', cwd: path.resolve './templates/static'

  describe 'single gadget', ->
    before (done) ->
      sdk.create "#{gadgetPath}/g1", done

    it 'should copy template files for g1', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g1").should.eql @templateFiles

  describe 'multiple gadgets', ->
    before (done) ->
      sdk.create ["#{gadgetPath}/g2"], ->
        sdk.create ["#{gadgetPath}/g3", "#{gadgetPath}/g4"], -> done()

    it 'should copy template files for g2', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g2").should.eql @templateFiles

    it 'should copy template files for g3', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g3").should.eql @templateFiles

    it 'should copy template files for g4', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g4").should.eql @templateFiles

  describe 'in folder with files', ->
    it 'should throw if run on non-empty folder', ->
      (-> sdk.create "#{gadgetPath}/g1").should.throw
