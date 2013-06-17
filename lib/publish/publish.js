(function() {
  var async, path, publish, sdk, _;

  _ = require('underscore');

  sdk = require('../../lib/sdk');

  path = require('path');

  async = require('async');

  module.exports = publish = {
    command: function(dest, options, callback) {
      if (options == null) {
        options = {};
      }
      if (callback == null) {
        callback = function() {};
      }
      if (!dest) {
        return callback(new Error("path for publish must be provided"));
      }
      dest = path.resolve(dest);
      return async.series({
        validate: function(cb) {
          return sdk.validate(dest, options, cb);
        },
        compress: function(cb) {
          return sdk.compress(dest, options, cb);
        },
        upload: function(cb) {
          return sdk.upload(dest, options, cb);
        }
      }, callback);
    }
  };

}).call(this);
