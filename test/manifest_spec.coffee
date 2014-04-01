assert = require 'assert'
path = require 'path'
manifest = require '../src/manifest'

describe 'Manifest helper', ->

  it 'should lookup manifest', (done) ->
    manifest.lookupManifest path.resolve('./test/fixtures/iframe-gadget'), (found) ->
      assert.equal found, path.resolve('./test/fixtures/iframe-gadget/manifest.json')
      done()

  it 'should read manifest', (done) ->
    manifest.readManifest path.resolve('./test/fixtures/iframe-gadget'), (err, manifest) ->
      assert.equal manifest.name, 'iframe-gadget'
      done()
