(function() {
  var async, sdk, _,
    __slice = [].slice;

  _ = require('underscore');

  async = require('async');

  sdk = {
    exec: function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this[command].apply(null, args);
    },
    createCommand: function(command, cmdOptions) {
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
          return cmd(dirs, options, callback);
        } else {
          funcs = _.map(dirs, function(dir) {
            return function(cb) {
              return cmd(dir, options, cb);
            };
          });
          return async.series(funcs, function(err) {
            return callback(err);
          });
        }
      };
    }
  };

  _.extend(sdk, {
    create: sdk.createCommand('create'),
    compile: sdk.createCommand('compile'),
    compress: sdk.createCommand('compress'),
    upload: sdk.createCommand('upload'),
    preview: sdk.createCommand('preview', {
      passThrough: true
    })
  });

  module.exports = sdk;

}).call(this);
