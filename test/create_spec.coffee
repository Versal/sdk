create = require '../src/create'
path = require 'path'
assert = require 'assert'
tmp = require 'tmp'
fs = require 'fs-extra'
cwd = null

describe 'versal create', ->
  describe 'iframe gadget', ->

    before (done) ->
      tmp.dir (err, tmp) ->
        cwd = tmp
        create 'foo', { cwd }, done

    it 'creates gadget folder', (done) ->
      fs.exists path.join(cwd, 'foo'), (exists) ->
        assert exists
        done()

    it 'sets correct name in manifest', (done) ->
      fs.readJson path.join(cwd, 'foo', 'manifest.json'), (err, manifest) ->
        assert.equal manifest.name, 'foo'
        done()

    it 'does not overwrite existing folder', (done) ->
      create 'foo', { cwd }, (err) ->
        assert err
        done()

  describe 'without a name', ->
    it 'throws an error', (done) ->
      create null, (err) ->
        assert err
        done()
