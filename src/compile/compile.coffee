_ = require 'underscore'
fs = require 'fs-extra'
path = require 'path'
requirejs = require 'requirejs'

almondPath = path.resolve "#{__dirname}/../../compile/almond.js"

module.exports = (src, options, callback = ->) ->
  # in case options hash is omitted
  if _.isFunction options
    callback = options
    options = {}

  # if destination is array, call create for each dir
  if _.isArray src
    funcs = _.map src, (dir) -> (cb) -> compile dir, options, cb
    # run all tasks sequentially
    async.series funcs, (err) -> callback err
  else
    compile src, options, callback

compile = (src, options, callback = ->) ->
  src = path.resolve src
  bundlePath = if options.out then path.resolve(options.out) else "#{src}/bundle"

  config =
    baseUrl: src
    out: (code) ->
      if fs.existsSync bundlePath then fs.removeSync bundlePath

      fs.mkdirsSync bundlePath
      fs.writeFileSync "#{bundlePath}/gadget.js", wrap code
      callback()

    include: ['gadget']
    optimize: 'none'
    paths:
      text: 'sdk/text',
      jquery: 'empty:',
      backbone: 'empty:',
      underscore: 'empty:',
      'cdn.backbone': 'empty:',
      'cdn.marionette': 'empty:',
      'cdn.jquery': 'empty:',
      'cdn.lodash': 'empty:',
      'cdn.processing': 'empty:',
      'cdn.raphael': 'empty:',
      'cdn.jqueryui': 'empty:'

  requirejs.optimize config, (->), (err) -> callback err

wrap = (code) ->
  code = wrapInAlmond code

wrapInAlmond = (code) ->
  almondCode = fs.readFileSync almondPath, 'utf-8'
  return almondCode + code

###
  config =
    name: path.relative(srcPath, path.join(__dirname, 'sdk/almond")),
    baseUrl: srcPath,
    out: function(text){
      sdk.writeGadget(sdk.wrapGadget(text), distPath + '/gadget.js');
    },
    include: ["gadget"],
    optimize: "none",
    paths: {
      text: "sdk/text",
      jquery: "empty:",
      backbone: "empty:",
      underscore: "empty:",
      // TODO: Make this dynamic
      "cdn.backbone": "empty:",
      "cdn.marionette": "empty:",
      "cdn.jquery": "empty:",
      "cdn.lodash": "empty:",
      "cdn.processing": "empty:",
      "cdn.raphael": "empty:",
      "cdn.jqueryui": "empty:"
    },
  };

  requirejs.optimize(config, function(buildResponse){
    async.parallel([
      function(cb) { fs.copy(fs.realpathSync(path.join(srcPath, "manifest.json")), path.join(distPath, "manifest.json"), cb); },
      function(cb) { fs.copy(fs.realpathSync(path.join(srcPath, "gadget.css")), path.join(distPath, "gadget.css"), cb); },
    ], function() {
      var opts = { inflateSymlinks: true };
      wrench.copyDirSyncRecursive(path.join(srcPath, "assets"), path.join(distPath, "assets"), opts);
      callback();
    });

  }, callback);
  ###