grunt = require 'grunt'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'

module.exports =

  mountFolder: (connect, dir) ->
    connect.static require('path').resolve dir

  serveIndex: (templatePath, config) ->
    index = fs.readFileSync templatePath, 'utf8'
    renderedIndex = _.template index, config

    (req, res, next) ->
      if req.url == '/'
        res.end renderedIndex, 'utf8'
      else
        next()

  cssRewriter: (relPath = 'app') ->
    (req, res, next) ->
      ext = path.extname req.url
      if ext == '.css'
        if /^\/styles\/vendor\/.*\.css/.test req.url
          filePath = path.join relPath, req.url
          rawFileContents = fs.readFileSync(filePath).toString 'utf8'
          fileContents = rawFileContents.replace /\.\.\/assets/g, '../../assets'

          res.writeHead 200
          return res.end fileContents

      next()
