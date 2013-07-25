sinon = require 'sinon'
should = require('chai').should()
Config = require '../src/config/config'

path = require 'path'
fs = require 'fs'

tempPath = path.resolve './temp'

describe.only 'Config', ->
	config = null

	before ->
		config = new Config versalPath: tempPath

	it 'should create config, if it does not exist', ->
		fs.existsSync("#{tempPath}/config.json").should.be.true

	it 'should initialize config with defaults', ->
		defaultConfig = require '../templates/config.json'
		config.raw.should.eql defaultConfig

	describe 'default env', ->
		before ->
			sinon.stub config, 'save'

		after ->
			config.save.restore()

		it 'should get apiURL', ->
			config.get('apiUrl').should.eq 'https://stack.versal.com/api2'

		it 'should get authUrl', ->
			config.get('authUrl').should.eq 'https://versal.com/signin'

		it 'should not get foo', ->
			should.not.exist config.get('foo')

		it 'should set foo', ->
			config.set('foo', 'bar')
			config.save.called.should.eq true

		it 'should get foo', ->
			config.get('foo').should.eq 'bar'

	describe 'custom env', ->
		before ->
			config.env 'staging'

		it 'should not get foo', ->
			should.not.exist config.get 'foo'

		it 'should set foo', ->
			config.set 'foo', 'baz'

		it 'should get foo for staging', ->
			config.get('foo').should.eq 'baz'

		it 'should not change default foo', ->
			config.env()
			config.get('foo').should.eq 'bar'

