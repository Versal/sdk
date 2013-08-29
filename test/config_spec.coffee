sinon = require 'sinon'
should = require('chai').should()
config = require '../src/config'

path = require 'path'
fs = require 'fs-extra'

home = path.resolve './temp/config'

describe 'Config', ->
  cfg = null

  before ->
    # create temp/config and temp/config/migrate for our experiments
    fs.mkdirsSync path.join home, 'migrate'

  describe 'migration', ->
    oldConfig = oldConfigPath = null

    before ->
      # old config was stored as .versal file in user's $HOME
      oldConfigPath = path.join home, 'migrate', '.versal'
      oldConfig =
        sessionIds:
          'https://stack.versal.com/api2': 'foo'
          'http://localhost': 'bar'
      fs.outputJsonSync oldConfigPath, oldConfig
      cfg = config { home: path.join home, 'migrate' }

    it 'should rename .versal to versal_old', ->
      fs.readJsonSync("#{home}/migrate/versal_old").should.eql oldConfig

    it 'should remove .versal file', ->
      fs.statSync(oldConfigPath).isFile().should.be.false

    it 'should set default:sessionId', ->
      cfg.get('sessionId').should.eq 'foo'

    it 'should set stage:sessionId', ->
      cfg.get('sessionId', env: 'stage').should.eq 'foo'

  describe 'when not exists', ->
    before (done) ->
      cfg = config { home }
      setTimeout done, 50

    it 'should create .versal/config.json', ->
      fs.existsSync("#{home}/.versal/config.json").should.be.true

    it 'should initialize config with the defaults', ->
      defaultConfig = require '../templates/config.json'
      cfg._data.should.eql defaultConfig

  describe 'when exists', ->
    before ->
      existing =
        default:
          x: 73
        foo:
          bar: 'baz'
      fs.outputJsonSync "#{home}/.versal/config.json", existing

      cfg = config { home }
      sinon.stub cfg, 'save'

    after ->
      cfg.save.restore()

    describe 'get', ->
      it 'should use "default" env by default', ->
        cfg.get('x').should.eq 73

      it 'should use specified env', ->
        cfg.get('bar', env: 'foo').should.eq 'baz'

      it 'should return undefined for non-existing key', ->
        should.not.exist cfg.get 'unknown'

    describe 'set', ->
      beforeEach ->
        cfg.save.reset()

      it 'should support ("key", "value") syntax', ->
        cfg.set 'x', 10
        cfg.save.called.should.be.true
        cfg.get('x').should.eq 10

      it 'should support ("key", "value", options) syntax', ->
        cfg.set 'x', 20, env: 'foo'
        cfg.save.called.should.be.true
        cfg.get('x', env: 'foo').should.eq 20

      it 'should support ({ key: value }) syntax', ->
        cfg.set x: 30
        cfg.save.called.should.be.true
        cfg.get('x').should.eq 30

      it 'should support ({ key: value }, options) syntax', ->
        cfg.set { x: 40 }, env: 'foo'
        cfg.save.called.should.be.true
        cfg.get('x', env: 'foo').should.eq 40

    describe 'env', ->
      it 'should switch env', ->
        cfg.env 'new'
        cfg._env.should.eq 'new'

      it 'should set value in new env', ->
        cfg.set 'x', 10
        cfg.get('x').should.eq 10

      it 'should not override default x', ->
        cfg.get('x', env: 'default').should.not.eq 10
