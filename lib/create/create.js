(function() {
  var async, defaults, fs, glob, ncp, path, _;

  _ = require('underscore');

  glob = require('glob');

  ncp = require('ncp');

  path = require('path');

  fs = require('fs-extra');

  async = require('async');

  defaults = {
    template: 'static'
  };

  module.exports = {
    command: function(dest, options, callback) {
      var err, template;
      if (callback == null) {
        callback = function() {};
      }
      if (!dest) {
        return callback(new Error("destination path must be provided"));
      }
      dest = path.resolve(dest);
      options = _.extend(defaults, options);
      template = path.resolve("" + __dirname + "/../../templates/" + options.template);
      if (!fs.existsSync(template)) {
        throw new Error("template not found: " + options.template);
      }
      if (fs.existsSync(dest)) {
        try {
          fs.rmdirSync(dest);
        } catch (_error) {
          err = _error;
          throw new Error("directory not empty: " + dest);
        }
      }
      fs.mkdirsSync(dest);
      return ncp(template, dest, function(err) {
        if (err) {
          return callback(err);
        }
        return callback();
      });
    }
  };

}).call(this);
