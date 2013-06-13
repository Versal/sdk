connect = require 'connect'
open = require 'open'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'
Bridge = require './bridge'

defaults = 
  port: 3000
  cwd: process.cwd()

module.exports = (options, callback) ->
  options = _.extend defaults, options

  callback = callback || ->
  bridge = new Bridge port: options.port

  url = "http://localhost:#{options.port}"

  # Add gadget from current directory, if exists
  bridge.addGadget options.cwd

  bridge.app.listen options.port
  open url
#open url
###
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

  http.createServer(app).listen(port);###