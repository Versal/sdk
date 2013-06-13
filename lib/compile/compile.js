(function() {
  var almondPath, compile, fs, path, requirejs, wrap, wrapInAlmond, _;

  _ = require('underscore');

  fs = require('fs-extra');

  path = require('path');

  requirejs = require('requirejs');

  almondPath = path.resolve("" + __dirname + "/../../compile/almond.js");

  module.exports = function(src, options, callback) {
    var funcs;
    if (callback == null) {
      callback = function() {};
    }
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    }
    if (_.isArray(src)) {
      funcs = _.map(src, function(dir) {
        return function(cb) {
          return compile(dir, options, cb);
        };
      });
      return async.series(funcs, function(err) {
        return callback(err);
      });
    } else {
      return compile(src, options, callback);
    }
  };

  compile = function(src, options, callback) {
    var bundlePath, config;
    if (callback == null) {
      callback = function() {};
    }
    src = path.resolve(src);
    bundlePath = options.out ? path.resolve(options.out) : "" + src + "/bundle";
    config = {
      baseUrl: src,
      out: function(code) {
        if (fs.existsSync(bundlePath)) {
          fs.removeSync(bundlePath);
        }
        fs.mkdirsSync(bundlePath);
        fs.writeFileSync("" + bundlePath + "/gadget.js", wrap(code));
        return callback();
      },
      include: ['gadget'],
      optimize: 'none',
      paths: {
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
      }
    };
    return requirejs.optimize(config, (function() {}), function(err) {
      return callback(err);
    });
  };

  wrap = function(code) {
    return code = wrapInAlmond(code);
  };

  wrapInAlmond = function(code) {
    var almondCode;
    almondCode = fs.readFileSync(almondPath, 'utf-8');
    return almondCode + code;
  };

  /*
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
  */


}).call(this);
