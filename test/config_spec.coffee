sinon = require 'sinon'
should = require('chai').should()
config = require '../src/config'
tmp = require 'tmp'
path = require 'path'
fs = require 'fs-extra'

describe 'Config', ->
  cfg = home = null

  describe 'when not exists', ->
    before (done) ->
      tmp.dir (err, dir) ->
        home = dir
        cfg = config { home }
        setTimeout done, 50

    it 'should create .versal/sdk/default.json', ->
      fs.existsSync("#{home}/.versal/sdk/default.json").should.be.true

    it 'should initialize config with the defaults', ->
      defaultConfig = require '../templates/default.json'
      cfg._data.should.eql defaultConfig

  describe 'when exists', ->
    before ->
      existing =
        default:
          x: 73
        foo:
          bar: 'baz'
      fs.outputJsonSync "#{home}/.versal/sdk/default.json", existing

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
