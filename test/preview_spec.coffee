preview = require '../src/preview'
path = require 'path'
assert = require 'assert'

describe 'versal preview', ->
  before ->
    preview.startServer = ->

  it 'links gadgets and starts server', (done) ->
    preview [path.resolve('./test/fixtures/iframe-gadget')], { port: 0 }, done

  it 'single argument is ok too', (done) ->
    preview path.resolve('./test/fixtures/iframe-gadget'), { port: 0 }, done

  it 'does not start server when no gadgets found', (done) ->
    preview ['/non/existing/path'], { port: 0 }, (err) ->
      assert err
      done()
