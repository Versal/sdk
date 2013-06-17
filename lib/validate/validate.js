(function() {
  var glob, path, _;

  _ = require('underscore');

  glob = require('glob');

  path = require('path');

  module.exports = {
    command: function(dest, options, callback) {
      var errors, files, manifest;
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = function() {};
      }
      dest = path.resolve(dest);
      files = glob.sync('**/*.*', {
        cwd: dest
      });
      errors = this.validateFiles(files);
      if (errors.length) {
        return callback(errors);
      }
      manifest = require("" + dest + "/manifest.json");
      errors = this.validateManifest(manifest);
      if (errors.length) {
        return callback(errors);
      }
      return callback();
    },
    manifestFields: {
      name: {
        required: true,
        regex: /^[A-Za-z0-9-_]{2,}$/,
        message: 'manifest.json: name can contain only latin letters, numbers, dashes and underscores'
      },
      version: {
        required: true,
        regex: /^\d+\.\d+\.\d+$/,
        message: 'manifest.json: version must be specified in format: X.X.X, where each X is a number'
      },
      description: {
        required: true
      }
    },
    requiredFiles: ["manifest.json", "gadget.js", "gadget.css", "assets/icon.png"],
    validateManifest: function(manifest) {
      var errors, missing, wrongFormat,
        _this = this;
      errors = [];
      missing = _.filter(_.keys(this.manifestFields), function(key) {
        return _this.manifestFields[key].required && !manifest.hasOwnProperty(key);
      });
      wrongFormat = _.filter(_.keys(this.manifestFields), function(key) {
        return _this.manifestFields[key].regex && !_this.manifestFields[key].regex.test(manifest[key]);
      });
      errors = _.map(missing, function(key) {
        return "manifest.json: " + key + " is required";
      });
      errors = errors.concat(_.map(wrongFormat, function(key) {
        return _this.manifestFields[key].message;
      }));
      return errors;
    },
    validateFiles: function(files) {
      var missing;
      missing = _.difference(this.requiredFiles, files);
      return _.map(missing, function(file) {
        return "" + file + " not found in the gadget folder";
      });
    }
  };

}).call(this);
