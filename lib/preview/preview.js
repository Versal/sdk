(function() {
  var Bridge, async, connect, defaults, fs, open, path, sdk, _;

  connect = require('connect');

  open = require('open');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  sdk = require('../../lib/sdk');

  async = require('async');

  Bridge = require('./bridge');

  defaults = {
    port: 3000
  };

  module.exports = {
    command: function(dirs, options, callback) {
      if (callback == null) {
        callback = function() {};
      }
      options = _.extend(defaults, options);
      if (!options.bridge) {
        options.bridge = new Bridge({
          port: options.port
        });
      }
      console.log("compiling gadgets...");
      return async.map(dirs, function(dir, cb) {
        dir = path.resolve(dir);
        return sdk.compile(dir, options, function(err) {
          if (err) {
            return cb(err);
          }
          if (fs.existsSync("" + dir + "/dist")) {
            options.bridge.addGadget("" + dir + "/dist");
            return cb(null, true);
          } else {
            return cb(null, false);
          }
        });
      }, function(err, results) {
        var successful, total;
        total = results.length;
        successful = _.filter(results, function(r) {
          return r;
        }).length;
        console.log("" + successful + " of " + total + " gadgets compiled successfully");
        if (!options.test) {
          options.bridge.app.listen(options.port);
          console.log('');
          console.log(" \\ \\/ /  Starting web server on " + options.bridge.url);
          console.log("  \\/ /   Press Ctrl + C to exit...");
        }
        return callback();
      });
    }
  };

}).call(this);
