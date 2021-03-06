_ = require 'underscore'
fs = require 'fs-extra'
path = require 'path'
requirejs = require 'requirejs'
async = require 'async'
fstream = require 'fstream'
manifestLoader = require('./manifest')

compiler =
  # TODO: make compile command return compiled gadget manifest
  compile: (dir, callback) =>
    src = path.resolve dir
    dest = path.join src, 'dist'

    manifestLoader.readManifest src, (err, manifest) ->
      if err then return callback(err)

      options = { src, dest, manifest }

      config =
        baseUrl: src
        include: ['gadget']
        optimize: 'none'
        cjsTranslate: true
        paths:
          text: path.resolve("#{__dirname}/../lib/text"),
          jquery: 'empty:',
          backbone: 'empty:',
          underscore: 'empty:',
          'cdn.backbone': 'empty:',
          'cdn.marionette': 'empty:',
          'cdn.jquery': 'empty:',
          'cdn.underscore': 'empty:',
          'cdn.lodash': 'empty:',
          'cdn.processing': 'empty:',
          'cdn.raphael': 'empty:',
          'cdn.jqueryui': 'empty:',
          'cdn.mathjax': 'empty:'
        stubModules: ['text']
        out: (code) =>
          options.code = code
          compiler.createBundle options, callback

      if manifest.uglify
        config = _.extend config,
          optimize: 'uglify2'

      requirejs.optimize config, (->), (err) -> callback err

  simplyCopyFilesToDist: (src, callback) ->
    distPath = path.join(src, 'dist')
    fs.remove distPath, (err) ->
      if err then return callback err

      reader = fstream.Reader({ path: src, type: 'Directory' })
      reader.on 'end', callback
      reader.on 'error', callback
      reader.pipe(fstream.Writer({ path: distPath, type: 'Directory' }))

  createBundle: (options, callback) ->
    if fs.existsSync options.dest then fs.removeSync options.dest
    # create "dist" directory
    fs.mkdirsSync options.dest

    @writeManifest options
    @writeJs options
    @writeCss options

    # copy assets and callback when its done
    @copyFiles options.src, options.dest, callback

  writeManifest: (options) ->
    manifest = _.clone options.manifest
    fs.writeJsonSync "#{options.dest}/versal.json", manifest

  writeJs: (options) ->
    # wrap and write gadget.js
    fs.writeFileSync "#{options.dest}/gadget.js", @wrap options.code

  wrap: (code) ->
    cdndeps = @extractCDNDeps code
    nodedeps = @extractNodeDeps code

    # request all the dependencies, required by node, from CDN
    # e.g. if somewhere in the code you require('jquery')
    # it will add 'cdn.jquery' to the root 'define' of the gadget
    cdndeps = cdndeps.concat _.map nodedeps, (dep) -> "cdn.#{dep}"
    cdndeps = _.uniq cdndeps

    return [
      @rootDefine(cdndeps)
      @almondCode()
      @defineDeps(cdndeps)
      @defineDeps(nodedeps)
      code
      @requireGadget()
    ].join('\n')

  rootDefine: (deps) ->
    # Inject list of cdn.deps into root-level call of define
    # e.g.: define(['cdn.jquery', 'cdn.backbone'])
    commaSeparatedDeps = _.map(deps, (dep) -> "'#{dep}'").join ','
    result = "define([#{commaSeparatedDeps}], function(){\n"
    if deps
      result += "var cdn = {};\n"
      for dep, i in deps
        # set property on local cdn object
        # e.g.: cdn.backbone = arguments[0];
        result += "#{dep} = arguments[#{i}];\n"
    return result

  almondCode: ->
    fs.readFileSync path.resolve("#{__dirname}/../lib/almond.min.js"), 'utf-8'

  defineDeps: (deps) ->
    # add define to the package
    # e.g.: define('cdn.backbone', [], function(){ return cdn.backbone; })
    result = ''
    for dep in deps
      raw_dep = dep.replace /^cdn\./, ''
      result += "define('#{dep}', [], function(){ return cdn.#{raw_dep} });\n"
    return result

  requireGadget: ->
    'return require(\'gadget\'); \n });'

  extractNodeDeps: (code) ->
    # find dependencies on underscore, backbone, jquery
    # that are specified in node requires:
    #   require 'underscore'
    depFinder = /require\s*[\(]?\s*['"](underscore|jquery|backbone)['"]/gi
    deps = []
    while match = depFinder.exec code
      deps.push match[1]
    return _.uniq deps

  extractCDNDeps: (code) ->
    # find all dependencies in gadget code
    # assumes, that dependency matches
    # `cdn.<something>` wrapped in quotation marks:
    # e.g. 'cdn.backbone', "cdn.jquery"
    depFinder = /['"](cdn\.([^'"]+))['"]/g
    deps = []
    while match = depFinder.exec code
      deps.push match[1]
    return _.uniq deps

  writeCss: (options) ->
    fs.copySync "#{options.src}/gadget.css", "#{options.dest}/gadget.css"

  copyFiles: (src, dest, callback) ->
    # copy assets
    pathsToCopy = ['assets']

    # create async copy request for each file
    funcs = _.map pathsToCopy, (path) ->
      (cb) -> fs.copy "#{src}/#{path}", "#{dest}/#{path}", cb

    # callback when all files are copied
    async.series funcs, callback

module.exports = compiler.compile
