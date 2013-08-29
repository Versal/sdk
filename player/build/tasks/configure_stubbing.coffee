_ = require 'lodash'
path = require 'path'
fs = require 'fs'
grunt = require 'grunt'
walkdir = require 'walkdir'
ncp = require 'ncp'

getStubbedViews = ->
  rootPath = path.join __dirname, '../app/scripts/views/stubbed'
  allPaths = walkdir.sync rootPath
  coffeePaths = _.select allPaths, (filePath) ->
    path.extname(filePath) == '.coffee'

  _.map coffeePaths, (coffeePath) ->
    coffeePath = coffeePath.substr (rootPath.length + 1) # strip path prefix
    coffeePath = coffeePath.substr 0, (coffeePath.length - 7) # strip .coffee
    coffeePath

grunt.registerTask "configure-stubbing", "A task to configure stubbing.", ->
  done = this.async()
  config = grunt.option 'config'

  for stubbedView in getStubbedViews()
    stubbedViewsParts = stubbedView.split path.sep
    stubName = stubbedViewsParts.pop()
    stubRelPath = stubbedViewsParts.join path.sep

    defaultPath = path.join __dirname, "../dist/scripts/views/#{stubbedView}.js"
    aliasPath = path.join __dirname, "../dist/scripts/views/#{stubRelPath}/default_#{stubName}.js"
    stubPath = path.join __dirname, "../dist/scripts/views/stubbed/#{stubbedView}.js"
    stubDefaultPath = path.join __dirname, "../dist/scripts/views/stubbed/#{stubRelPath}/default_#{stubName}.js"

    # Copy original to stubbed dir for tests
    fs.unlinkSync stubDefaultPath if fs.existsSync stubDefaultPath
    ncp defaultPath, stubDefaultPath, ->

      if config.stubbed
        # Copy original to alias
        fs.unlinkSync aliasPath if fs.existsSync aliasPath
        ncp defaultPath, aliasPath, ->

          # Copy stub over original
          fs.unlinkSync defaultPath
          ncp stubPath, defaultPath, ->

          done()
      else
        done()
