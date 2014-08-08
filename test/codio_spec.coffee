codio = require '../src/codio'
path = require 'path'
assert = require 'assert'
tmp = require 'tmp'
fs = require 'fs-extra'

describe.only 'versal codio', ->
  cwd = null

  before (done) ->
    tmp.dir (err, tmp) ->
      cwd = tmp
      codio { cwd }, done

  it 'creates .codio file', (done) ->
    fs.exists path.join(cwd, '.codio'), (exists) ->
      assert exists
      done()

  it '.codio file contains sections for run and preview buttons', ->
    fs.readJson path.join(cwd, '.codio'), (err, json) ->
      if err then throw err
      assert json.hasOwnProperty 'commands'
      assert json.hasOwnProperty 'preview'
