fs = require 'fs-extra'
path = require 'path'
sinon = require 'sinon'
install = require '../src/install/install'
needle = require 'needle'

describe 'Install', ->
  paths = ['versal/text@0.1.0', 'versal/image@0.7.3']

  describe 'invalid arguments', ->
    options =
      apiUrl: 'http://api'
      sessionId: 'X'
      cwd: path.resolve 'temp/install'

    before ->
      sinon.stub(needle, 'get').callsArgWith(2, null, { statusCode: 404 }, { message: 'Gadget project not found '})

    after ->
      needle.get.restore()

    it 'should return error if type doesnt look like gadget type', (done) ->
      install.command 'invalid/type', null, (err) ->
        err.should.match /Invalid gadget type/
        done()

    it 'should return error if type is not found', (done) ->
      install.command 'non/existing@gadget', options, (err) ->
        err.should.match /Gadget project not found/
        done()

  describe 'from rest-api', ->
    options =
      apiUrl: 'http://api'
      sessionId: 'X'
      cwd: path.resolve 'temp/install'

    manifestUrl = 'http://api/gadgets/versal/text/0.1.0/manifest'
    compiledUrl = 'http://api/gadgets/versal/text/0.1.0/compiled.zip'
    target = "#{options.cwd}/versal_data/gadgets/versal/text/0.1.0"

    before (done) ->
      sinon.stub needle, 'get', (url, options, callback) ->
        if url == manifestUrl
          return callback null, { statusCode: 200 }, { username: 'versal', name: 'text', version: '0.1.0' }
        if url == compiledUrl
          return callback null, { statusCode: 200 }, fs.readFileSync path.resolve './test/fixtures/install/compiled.zip'

      install.command 'versal/text@0.1.0', options, -> done()

    after ->
      needle.get.restore()

    it 'should call get', ->
      needle.get.called.should.be.true

    it 'should hit correct url for manifest', ->
      needle.get.firstCall.args[0].should.eq manifestUrl

    it 'should hit correct url for compiled', ->
      needle.get.secondCall.args[0].should.eq compiledUrl

    it 'should set SESSION_ID header to get the manifest', ->
      needle.get.firstCall.args[1].headers.SESSION_ID.should.eq 'X'

    it 'should create gadget folder', ->
      fs.existsSync(target).should.be.true

    it 'should store compiled.zip', ->
      fs.existsSync("#{target}/compiled.zip").should.be.true

    it 'should unzip compiled.zip', ->
      fs.existsSync("#{target}/gadget.js").should.be.true
      fs.existsSync("#{target}/gadget.css").should.be.true
      fs.existsSync("#{target}/manifest.json").should.be.true

  describe 'from folder', ->
    options =
      cwd: path.resolve 'temp/install'
    target = "#{options.cwd}/versal_data/gadgets/versal/test/1.2.3"

    before (done) ->
      install.command path.resolve('./test/fixtures/install/simple'), options, ->
        done()

    it 'should create target folder', ->
      fs.existsSync(target).should.be.true

    it 'should copy required files', ->
      fs.existsSync("#{target}/gadget.js").should.be.true
      fs.existsSync("#{target}/gadget.css").should.be.true
      fs.existsSync("#{target}/manifest.json").should.be.true
