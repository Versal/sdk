(function() {
  var async, sdk, _;

  _ = require('underscore');

  async = require('async');

  module.exports = sdk = {
    create: function() {
      return sdk.execCommand('create').apply(null, arguments);
    },
    docs: function() {
      return sdk.execCommand('docs').apply(null, arguments);
    },
    compile: function() {
      return sdk.execCommand('compile').apply(null, arguments);
    },
    compress: function() {
      return sdk.execCommand('compress').apply(null, arguments);
    },
    upload: function() {
      return sdk.execCommand('upload').apply(null, arguments);
    },
    preview: function() {
      return sdk.execCommand('preview', {
        passThrough: true
      }).apply(null, arguments);
    },
    validate: function() {
      return sdk.execCommand('validate').apply(null, arguments);
    },
    publish: function() {
      return sdk.execCommand('publish').apply(null, arguments);
    },
    execCommand: function(command, cmdOptions) {
      if (cmdOptions == null) {
        cmdOptions = {};
      }
      return function(dirs, options, callback) {
        var cmd, funcs;
        if (callback == null) {
          callback = function() {};
        }
        if (!dirs) {
          throw new Error('dirs is required');
        }
        if (!_.isArray(dirs)) {
          dirs = [dirs];
        }
        if (_.isFunction(options)) {
          callback = options;
          options = {};
        }
        cmd = require("./" + command + "/" + command);
        if (cmdOptions.passThrough) {
          return cmd.command(dirs, options, callback);
        } else {
          funcs = _.map(dirs, function(dir) {
            return function(cb) {
              return cmd.command(dir, options, cb);
            };
          });
          return async.series(funcs, function(err) {
            return callback(err);
          });
        }
      };
    }
  };

}).call(this);
