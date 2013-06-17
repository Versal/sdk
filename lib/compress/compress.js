(function() {
  var async, fs, glob, notGoodEnough, path, spawn, _;

  _ = require('underscore');

  fs = require('fs-extra');

  glob = require('glob');

  path = require('path');

  async = require('async');

  spawn = require('child_process').spawn;

  module.exports = function(dest, options, callback) {
    var excludePath, zip;
    if (callback == null) {
      callback = function() {};
    }
    dest = path.resolve(dest);
    excludePath = path.resolve("" + __dirname + "/../../src/compress/exclude.lst");
    if (!fs.existsSync(dest)) {
      return callback(new Error("directory does not exist: " + dest));
    }
    zip = spawn('zip', ['-r', 'bundle.zip', '.', "-x@" + excludePath], {
      cwd: dest
    });
    return zip.on('exit', function(code) {
      if (code !== 0) {
        return callback(new Error("zip process exited with code " + code));
      }
      return callback();
    });
  };

  notGoodEnough = function(file) {
    if (/^dist\//.test(file)) {
      return true;
    }
    if (/bundle\.zip$/.test(file)) {
      return true;
    }
    if (/^bundle\//.test(file)) {
      return true;
    }
    return false;
  };

}).call(this);
