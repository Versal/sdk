(function() {
  var Bridge, connect, defaults, fs, open, path, _;

  connect = require('connect');

  open = require('open');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

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
      _.forEach(dirs, function(dir) {
        dir = path.resolve(dir);
        if (fs.existsSync("" + dir + "/dist")) {
          return options.bridge.addGadget("" + dir + "/dist");
        }
      });
      if (!options.test) {
        options.bridge.app.listen(options.port);
        console.log('');
        console.log(" \\ \\/ /  Starting web server on " + options.bridge.url);
        console.log("  \\/ /   Press Ctrl + C to exit...");
        open(options.bridge.url);
      }
      return callback();
    }
  };

}).call(this);
