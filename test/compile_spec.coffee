require('chai').should()
path = require 'path'
glob = require 'glob'
fs = require 'fs'

compile = require '../../lib/compile/compile'
create = require '../../lib/create/create'

gadgetPath = path.resolve './temp/gadgets'

describe 'Compile', ->
  describe 'single gadget', ->
    before (done) ->
      create "#{gadgetPath}/g5", ->
        compile "#{gadgetPath}/g5", ->
          done()

    it 'should compile gadget into bundle folder', ->
      fs.existsSync("#{gadgetPath}/g5/bundle").should.be.true

    it 'should copy assets', ->
      assets = glob.sync '**/*.*', "#{gadgetPath}/g5/assets"
      glob.sync('**/*.*', "#{gadgetPath}/g5/bundle/assets").should.eql assets

    it 'should have gadget.js and gadget.css', ->
      console.log glob.sync('*.*', "#{gadgetPath}/g5/bundle")
      glob.sync('*.*', "#{gadgetPath}/g5/bundle").should.eql standardFiles

    it 'gadget.js should equal standard gadget.js', ->
      standardGadget = fs.readFileSync path.resolve('./test/fixtures/compile/static_gadget_compiled.js'), 'utf-8'
      fs.readFileSync("#{gadgetPath}/g5/bundle/gadget.js", 'utf-8').should.eql standardGadget
