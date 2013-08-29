should = require('chai').should()
path = require 'path'
glob = require 'glob'
sdk = require '../src/sdk'
fs = require 'fs'

gadgetPath = path.resolve './temp/gadgets'

describe 'Create', ->
  templateFiles = glob.sync '**/*.*', cwd: path.resolve './templates/static'

  describe 'single gadget', ->
    before (done) ->
      sdk.createGadget "#{gadgetPath}/g1", { username: 'test-user' }, done

    it 'should copy template files for g1', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g1").should.eql templateFiles

    it 'should set username', ->
      manifest = require "#{gadgetPath}/g1/manifest.json"
      manifest.username.should.eq 'test-user'

  describe 'multiple gadgets', ->
    before (done) ->
      sdk.createGadget ["#{gadgetPath}/g2"], ->
        sdk.createGadget ["#{gadgetPath}/g3", "#{gadgetPath}/g4"], -> done()

    it 'should copy template files for g2', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g2").should.eql templateFiles

    it 'should copy template files for g3', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g3").should.eql templateFiles

    it 'should copy template files for g4', ->
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g4").should.eql templateFiles

  describe 'in folder with files', ->
    it 'should throw if run on non-empty folder', ->
      (-> sdk.createGadget "#{gadgetPath}/g1").should.throw
