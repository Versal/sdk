_ = require 'underscore'
fs = require 'fs-extra'
ncp = require 'ncp'
path = require 'path'
requirejs = require 'requirejs'
async = require 'async'
css = require 'css'
jsapi = require 'js-api'

module.exports =
  # TODO: make compile command return compiled gadget manifest
  command: (dir, options = {}, callback = ->) ->
    src = path.resolve dir
    dest = if options.out then path.resolve(options.out) else "#{src}/dist"
    manifest = JSON.parse fs.readFileSync "#{src}/manifest.json"
    gadget = new jsapi.GadgetProject manifest

    options = _.extend _.clone(options), { src, dest, manifest, gadget }

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

    if manifest.uglify
      config = _.extend config,
        optimize: 'uglify2'

    requirejs.optimize config, (->), (err) -> callback err

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
    fs.writeJsonSync "#{options.dest}/manifest.json", manifest

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
    fs.readFileSync path.resolve("#{__dirname}/../../lib/almond.min.js"), 'utf-8'

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
    styles = fs.readFileSync "#{options.src}/gadget.css", 'utf-8'
    styles = @processCss(styles, options.gadget.cssClassName())
    fs.writeFileSync "#{options.dest}/gadget.css", styles

  processCss: (styles, className) ->
    ast = css.parse styles
    @_namespaceRules ast.stylesheet.rules, className
    return css.stringify ast, compress: true

  _namespaceRules: (rules, className) ->
    for rule in rules
      if rule.rules then @_namespaceRules rule.rules, className
      if rule.selectors
        rule.selectors = _.map rule.selectors, _.partial(@_prefixSelector, className)

  _prefixSelector: (prefix, selector) ->
    return selector if selector[0] == '@'
    ".#{prefix} #{selector}"

  copyFiles: (src, dest, callback) ->
    # copy assets
    pathsToCopy = ['assets']

    # create async copy request for each file
    funcs = _.map pathsToCopy, (path) ->
      (cb) -> ncp "#{src}/#{path}", "#{dest}/#{path}", cb

    # callback when all files are copied
    async.series funcs, callback
