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

  defaults.bridge = new Bridge({
    port: defaults.port
  });

  module.exports = function(dirs, options, callback) {
    var url;
    if (callback == null) {
      callback = function() {};
    }
    options = _.extend(defaults, options);
    url = "http://localhost:" + options.port;
    _.forEach(dirs, function(dir) {
      dir = path.resolve(dir);
      if (fs.existsSync("" + dir + "/dist")) {
        return options.bridge.addGadget("" + dir + "/dist");
      }
    });
    if (!options.test) {
      options.bridge.app.listen(options.port);
      open(url);
    }
    return callback();
  };

  /*
    var omitPath; // save this to omit the compiled version of gadget if we show uncompiled
  
    if (fs.existsSync(path.resolve(process.cwd()+"/gadget.js"))) {
      // currently previewed gadget
      app.use(connect.static(path.resolve(process.cwd())));
      omitPath = path.resolve(process.cwd());
    }
  
    // connect the gadgets in .versal
    var data = fs.readFileSync(path.resolve(sdk.configuration.versalKeyPath), "utf8");
    var gadgetPaths = JSON.parse(data)["gadgets"];
    _.forEach(gadgetPaths, function(dir){
      if (dir !== omitPath) {
        app.use(dir, connect.static(dir));
      }
    });
  
    console.log("Server is started on " + url);
    console.log("Press Control + C to exit.");
  
    http.createServer(app).listen(port);
  */


}).call(this);
