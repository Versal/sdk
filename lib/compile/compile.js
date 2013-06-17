(function() {
  var async, compile, copyFiles, createBundle, extractDeps, fs, ncp, path, requirejs, wrap, wrapDeps, wrapInAlmond, _;

  _ = require('underscore');

  fs = require('fs-extra');

  ncp = require('ncp');

  path = require('path');

  requirejs = require('requirejs');

  async = require('async');

  module.exports = compile = function(dir, options, callback) {
    var bundlePath, config, src;
    if (options == null) {
      options = {};
    }
    if (callback == null) {
      callback = function() {};
    }
    src = path.resolve(dir);
    bundlePath = options.out ? path.resolve(options.out) : "" + src + "/dist";
    config = {
      baseUrl: src,
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
        'cdn.underscore': 'empty:',
        'cdn.lodash': 'empty:',
        'cdn.processing': 'empty:',
        'cdn.raphael': 'empty:',
        'cdn.jqueryui': 'empty:'
      },
      out: function(code) {
        return createBundle(code, src, bundlePath, callback);
      }
    };
    return requirejs.optimize(config, (function() {}), function(err) {
      return callback(err);
    });
  };

  createBundle = function(code, src, bundlePath, callback) {
    if (fs.existsSync(bundlePath)) {
      fs.removeSync(bundlePath);
    }
    fs.mkdirsSync(bundlePath);
    fs.writeFileSync("" + bundlePath + "/gadget.js", wrap(code));
    return copyFiles(src, bundlePath, callback);
  };

  wrap = function(code) {
    var deps;
    code = wrapInAlmond(code);
    deps = extractDeps(code);
    code = wrapDeps(code, deps);
    return code;
  };

  wrapInAlmond = function(code) {
    var almondCode, almondPath;
    almondPath = path.resolve("" + __dirname + "/../../node_modules/almond/almond.js");
    almondCode = fs.readFileSync(almondPath, 'utf-8');
    return almondCode + code;
  };

  wrapDeps = function(code, deps) {
    var commaSeparatedDeps, dep, end, i, start, _i, _len;
    commaSeparatedDeps = _.map(deps, function(dep) {
      return "'" + dep + "'";
    }).join(',');
    start = "define([" + commaSeparatedDeps + "], function(){\r\n";
    if (deps) {
      start += "var cdn = {};\r\n";
    }
    end = '';
    for (i = _i = 0, _len = deps.length; _i < _len; i = ++_i) {
      dep = deps[i];
      start += "" + dep + " = arguments[" + i + "];\r\n";
      end += "define('" + dep + "', [], function(){ return " + dep + " });\r\n";
    }
    end += 'return require(\'gadget\');';
    end += '});';
    return start + code + end;
  };

  extractDeps = function(code) {
    var depFinder, deps, match;
    depFinder = /['"](cdn\.([^'"]+))['"]/g;
    deps = [];
    while (match = depFinder.exec(code)) {
      deps.push(match[1]);
    }
    return _.uniq(deps);
  };

  copyFiles = function(src, bundlePath, callback) {
    var funcs, pathsToCopy;
    pathsToCopy = ['gadget.css', 'manifest.json', 'assets'];
    funcs = _.map(pathsToCopy, function(path) {
      return function(cb) {
        return ncp("" + src + "/" + path, "" + bundlePath + "/" + path, cb);
      };
    });
    return async.series(funcs, callback);
  };

}).call(this);
