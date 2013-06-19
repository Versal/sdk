require('chai').should()
path = require 'path'
glob = require 'glob'
fs = require 'fs'

sdk = require '../lib/sdk'

gadgetPath = path.resolve './temp/gadgets'
fixturesPath = path.resolve './test/fixtures'

describe 'Compile', ->
  before (done) ->
    sdk.create "#{gadgetPath}/g5", ->
      sdk.compile "#{gadgetPath}/g5", (err) ->
        throw err if err
        done()

  describe 'dist folder', ->
    it 'should exist', ->
      fs.existsSync("#{gadgetPath}/g5/dist").should.be.true

    it 'should contain assets', ->
      assets = glob.sync '**/*.*', cwd: "#{gadgetPath}/g5/assets"
      glob.sync('**/*.*', cwd: "#{gadgetPath}/g5/dist/assets").should.eql assets

    it 'should have standard files', ->
      standardFiles = ['gadget.css', 'gadget.js', 'manifest.json']
      glob.sync('*.*', cwd: "#{gadgetPath}/g5/dist").should.eql standardFiles

  describe 'code', ->
    it 'should equal standard gadget', ->
      standardPath = path.resolve './test/fixtures/compile/static_compiled.js'
      standardCode = fs.readFileSync standardPath, 'utf-8'
      fs.readFileSync("#{gadgetPath}/g5/dist/gadget.js", 'utf-8').should.eql standardCode

  describe 'text! dependencies', ->
    before (done) ->
      # if compilation is successful, then text! references were successfully resolved
      sdk.compile "#{fixturesPath}/compile/text-gadget", out: "#{gadgetPath}/text-gadget", ->
        done()

    it 'should inline template', ->
      gadgetCode = fs.readFileSync "#{gadgetPath}/text-gadget/gadget.js", 'utf-8'
      gadgetCode.should.match new RegExp '<h1>Template!</h1>'
