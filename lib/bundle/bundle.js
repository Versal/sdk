(function() {
  var archiver, bundle, fs, glob, notGoodEnough, path, result, _;

  _ = require('underscore');

  fs = require('fs-extra');

  glob = require('glob');

  path = require('path');

  archiver = require('archiver');

  result = function(dest, options, callback) {
    var funcs;
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    }
    if (_.isArray(dest)) {
      funcs = _.map(dest, function(dir) {
        return function(cb) {
          return bundle(dir, options, cb);
        };
      });
      return async.series(funcs, function(err) {
        return callback(err);
      });
    } else {
      return bundle(dest, options, callback);
    }
  };

  result.notGoodEnough = notGoodEnough;

  module.exports = result;

  bundle = function(dest, options, callback) {
    var archive, bundlePath, file, filePath, files, output, _i, _len;
    dest = path.resolve(dest);
    bundlePath = "" + dest + "/bundle.zip";
    if (fs.existsSync(bundlePath)) {
      fs.unlinkSync(bundlePath);
    }
    output = fs.createWriteStream(bundlePath);
    archive = archiver('zip');
    archive.on('error', callback);
    archive.pipe(output);
    files = glob.sync("**/*.*", {
      cwd: dest
    });
    files = _.reject(files, notGoodEnough);
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      filePath = "" + dest + "/" + file;
      archive.append(fs.createReadStream(filePath), {
        name: file
      });
    }
    return archive.finalize(callback);
  };

  notGoodEnough = function(file) {
    if (/^dist\//.test(file)) {
      return true;
    }
    if (/bundle\.zip$/.test(file)) {
      return true;
    }
    return false;
  };

}).call(this);
