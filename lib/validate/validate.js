(function() {
  var validate, _;

  _ = require('underscore');

  validate = {
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
    command: function(dirs, options, callback) {},
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
    }
  };

  module.exports = validate;

}).call(this);
