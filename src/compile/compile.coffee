_ = require 'underscore'
fs = require 'fs-extra'
ncp = require 'ncp'
path = require 'path'
requirejs = require 'requirejs'
async = require 'async'
stylus = require 'stylus'
jsapi = require 'js-api'

module.exports =
  # TODO: make compile command return compiled gadget manifest
  command: (dir, options = {}, callback = ->) ->
    src = path.resolve dir
    dest = if options.out then path.resolve(options.out) else "#{src}/dist"
    manifest = JSON.parse fs.readFileSync "#{src}/manifest.json"
    gadget = new jsapi.GadgetProject manifest

    options = _.extend _.clone(options), { src, dest, gadget }

    config =
      baseUrl: src
      include: ['gadget']
      optimize: 'none'
      cjsTranslate: true
      paths:
        text: path.resolve("#{__dirname}/../../lib/text"),
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
        @createBundle options, callback

    unless options.raw
      config = _.extend config,
        optimize: 'uglify2'
        uglify2:
          mangle:
            except: 'require,define,cdn'

    requirejs.optimize config, (->), (err) -> callback err

  createBundle: (options, callback) ->
    # create "dist" directory
    if fs.existsSync options.dest then fs.removeSync options.dest
    fs.mkdirsSync options.dest

    # write gadget.js
    @writeJs options.code, options.dest

    # process css rules and prepend .gadget-id to every rule
    @writeCss options.src, options.dest, options.gadget

    # copy styles, manifest and assets and callback when its done
    @copyFiles options.src, options.dest, callback

  writeJs: (code, dest) ->
    # wrap and write gadget.js
    fs.writeFileSync "#{dest}/gadget.js", @wrap code

  wrap: (code) ->
    code = @wrapInAlmond code
    cdndeps = @extractCDNDeps code
    nodedeps = @extractNodeDeps code

    # request all the dependencies, required by node, from CDN
    # e.g. if somewhere in the code you require('jquery')
    # it will add 'cdn.jquery' to the root 'define' of the gadget
    cdndeps = cdndeps.concat _.map nodedeps, (dep) -> "cdn.#{dep}"
    cdndeps = _.uniq cdndeps

    code = @wrapNodeDeps code, nodedeps
    code = @wrapCDNDeps code, cdndeps

    return code

  wrapInAlmond: (code) ->
    # almond is in node_modules folder
    almondPath = path.resolve "#{__dirname}/../../lib/almond.min.js"
    almondCode = fs.readFileSync almondPath, 'utf-8'
    return almondCode + code

  wrapCDNDeps: (code, deps) ->
    # Inject list of cdn.deps into root-level call of define
    # e.g.: define(['cdn.jquery', 'cdn.backbone'])
    commaSeparatedDeps = _.map(deps, (dep) -> "'#{dep}'").join ','
    start = "define([#{commaSeparatedDeps}], function(){\r\n"
    if deps then start += "var cdn = {};\r\n"
    end = ''

    # Insert defines for cdn dependencies
    for dep, i in deps
      # set property on local cdn object
      # e.g.: cdn.backbone = arguments[0];
      start += "#{dep} = arguments[#{i}];\r\n"

      # add define to the package
      # e.g.: define('cdn.backbone', [], function(){ return cdn.backbone; })
      end += "define('#{dep}', [], function(){ return #{dep} });\r\n"

    end += 'return require(\'gadget\');'
    end += '});'

    return start + code + end

  wrapNodeDeps: (code, deps) ->
    end = ''
    for dep in deps
      end += "define('#{dep}', [], function(){ return cdn.#{dep}; });\r\n"
    return code + end

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

  writeCss: (src, dest, gadget) ->
    css = fs.readFileSync "#{src}/gadget.css", 'utf-8'
    # Css processing is disabled for v 0.2.9
    fs.writeFileSync "#{dest}/gadget.css", css #@processCss(css, gadget)

  processCss: (css, gadget = {}) ->
    throw new Error 'gadget.cssClassName is required for css processing' unless gadget.cssClassName
    styl = stylus.convertCSS css
    # prepend gadget class and indent all lines by two spaces
    lines = [".#{gadget.cssClassName()}"].concat _.map styl.split('\n'), (line) -> "  #{line}"

    return stylus(lines.join('\n'), { compress: true }).render()

  copyFiles: (src, dest, callback) ->
    # copy manifest.json and assets folder
    pathsToCopy = ['manifest.json', 'assets']

    # create async copy request for each file
    funcs = _.map pathsToCopy, (path) ->
      (cb) -> ncp "#{src}/#{path}", "#{dest}/#{path}", cb

    # callback when all files are copied
    async.series funcs, callback