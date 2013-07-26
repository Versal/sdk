config = require '../src/config'
needle = require 'needle'
querystring = require 'querystring'
sinon = require 'sinon'
should = require('chai').should()
signin = require '../src/signin/signin'

describe 'Sign in', ->
  post = configGet = get = set = null
  validCredentials = { email: 'am@versal.com', password: '12345' }

  before ->
    validData = querystring.stringify validCredentials

    post = sinon.stub(needle, 'post').callsArgWith(3, null, { statusCode: 401 }, { message: 'invalid email or password' })
    post.withArgs('versal.com/signin', validData).callsArgWith(3, null, { statusCode: 200 }, { sessionId: 'A1B2'})
    get = sinon.stub(needle, 'get').callsArgWith(2, null, { statusCode: 401 }, { message: ''} )
    get.withArgs('api/user', { headers: { session_id: 'A1B2' }}).callsArgWith(2, null, { statusCode: 200}, { username: 'am' })

    configGet = sinon.stub(config, 'get')
    configGet.withArgs('apiUrl').returns('api')
    configGet.withArgs('authUrl').returns('versal.com/signin')

  after ->
    post.restore()
    get.restore()
    configGet.restore()

  it 'should skip prompt if email and password are provided in options', ->
    credentials = { email: 'a', password: 'b' }
    signin.promptCredentials credentials, (err, creds) ->
      creds.should.eql credentials

  describe 'with valid credentials', ->
    session = null

    before (done) ->
      signin.signin validCredentials, (err, sessionId) ->
        session = sessionId
        done()

    it 'should return sessionId', ->
      session.should.eq 'A1B2'

  describe 'with invalid credentials', ->
    it 'should return a error', (done) ->
      signin.signin { email: 'hacker', password: '12345' }, (err) ->
        err.should.match /invalid email or password/
        done()

  describe 'get user details', ->
    it 'should return user details for valid sessionId', (done) ->
      signin.getUserDetails sessionId: 'A1B2', (err, body) ->
        should.not.exist err
        body.username.should.eq 'am'
        done()

    it 'should return error for invalid sessionId', (done) ->
      signin.getUserDetails sessionId: 'X', (err) ->
        err.should.match /session id is no longer valid/
        done()

  describe 'within the SDK', ->
    set = null

    before (done) ->
      set = sinon.stub(config, 'set')
      signin.command null, validCredentials, (err) ->
        done()

    after ->
      set.restore()

    it 'should set sessionId', ->
      set.firstCall.args.should.eql ['sessionId', 'A1B2']

    it 'should set username', ->
      set.secondCall.args.should.eql ['username', 'am']