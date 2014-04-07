preview = require ('../src/preview')
path = require 'path'
assert = require 'assert'

describe 'versal preview', ->
  it 'links gadgets and starts server', (done) ->
    preview.startServer = ->
    preview [path.resolve('./test/fixtures/iframe-gadget')], (err, cnt) ->
      assert.equal cnt, 1
      done()

  it 'single argument is ok too', (done) ->
    preview.startServer = ->
    preview path.resolve('./test/fixtures/iframe-gadget'), (err, cnt) ->
      assert.equal cnt, 1
      done()

  it 'does not start server when no gadgets found', ->
    assert.throws ->
      preview ['/non/existing/path']
