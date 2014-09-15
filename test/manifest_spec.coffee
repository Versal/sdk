assert = require 'assert'
path = require 'path'
manifest = require '../src/manifest'

describe 'Manifest helper', ->

  it 'should lookup manifest', ->
    manifestPath = manifest.lookupManifest path.resolve('./test/fixtures/iframe-gadget')
    assert.equal manifestPath, path.resolve('./test/fixtures/iframe-gadget/versal.json')

  it 'should read manifest', (done) ->
    manifest.readManifest path.resolve('./test/fixtures/iframe-gadget'), (err, manifest) ->
      assert.equal manifest.name, 'iframe-gadget'
      done()
