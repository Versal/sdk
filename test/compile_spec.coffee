require('chai').should()
path = require 'path'
glob = require 'glob'
sinon = require 'sinon'
fs = require 'fs'
sdk = require '../src/sdk'
compile = require '../src/compile/compile'

gadgetPath = path.resolve './temp/gadgets'
fixturesPath = path.resolve './test/fixtures'

describe 'Compile', ->
  before (done) ->
    sdk.createGadget "#{gadgetPath}/g5", ->
      sdk.compile "#{gadgetPath}/g5", (err) ->
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
      standardPath = path.resolve './test/fixtures/compile/static_compiled.min.js'
      standardCode = fs.readFileSync standardPath, 'utf-8'
      fs.readFileSync("#{gadgetPath}/g5/dist/gadget.js", 'utf-8').should.eql standardCode

  describe 'text! dependencies', ->
    before (done) ->
      # if compilation is successful, then text! references were successfully resolved
      sdk.compile "#{fixturesPath}/compile/text-gadget", { out: "#{gadgetPath}/text-gadget", raw: true }, ->
        done()

    it 'should inline template', ->
      gadgetCode = fs.readFileSync "#{gadgetPath}/text-gadget/gadget.js", 'utf-8'
      gadgetCode.should.match new RegExp '<h1>Template!</h1>'

  describe 'cdn.* dependencies', ->
    deps = null

    before ->
      code = '"cdn.jquery" and \'cdn.underscore\' and again \'cdn.jquery\''
      deps = compile.extractCDNDeps code

    it 'should extract jquery and underscore', ->
      deps.should.eql ['cdn.jquery', 'cdn.underscore']

  describe 'node dependencies', ->
    deps = null

    before ->
      code = 'var underscore = require ( "underscore" ) and jquery = require \'jquery\''
      deps = compile.extractNodeDeps code

    it 'should contain jquery and underscore', ->
      deps.should.eql ['underscore', 'jquery']

  describe 'wrap', ->
    code = result = null

    before ->
      code = 'var jquery = require("jquery");'
      result = compile.wrap code

    it 'should request cdn.dependencies from the player', ->
      result.should.match /^define\(\['cdn\.jquery'\]/

    it 'should define cdn dependencies', ->
      result.should.match /define\('cdn\.jquery'/

    it 'should define node dependencies', ->
      result.should.match /define\('jquery'/

    it 'should require gadget', ->
      result.should.match /return require\('gadget'\);\s*}\);$/

  describe 'css processing', ->
    css = result = project = null

    before ->
      css = 'h1 { color: white; } .blue { color: blue; } p #red { color: red; }'
      project =
        cssClassName: -> 'gadget-am-test-001'
      result = compile.processCss css, project.cssClassName()

    it 'should prefix all css rules with gadget class name', ->
      result.should.eql '.gadget-am-test-001 h1{color:#fff}\n.gadget-am-test-001 .blue{color:#00f}\n.gadget-am-test-001 p #red{color:#f00}\n'

  describe 'writeCss', ->
    options =
      src: "#{fixturesPath}/compile"
      dest: "#{gadgetPath}"
      gadget: { cssClassName: -> 'gadget-am-test-001' }

    beforeEach ->
      sinon.stub compile, 'processCss'

    afterEach ->
      compile.processCss.restore()

    it 'should call processCss', ->
      compile.writeCss options
      compile.processCss.called.should.be.true
