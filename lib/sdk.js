var sdk = module.exports = {};
var path = require("path"); 
var spawn = require("child_process").spawn;
var assert = require("assert");
var fs = require("fs-extra")

assert.pathExists = function(src){
  src = path.resolve(src);
  if(!fs.existsSync(src)) {
    throw new Error(src + " does not exists!");
  }
}

sdk.exec = function(cmd, argv){
  console.log("You want me to " + cmd);
  sdk[cmd].call(null, argv);
}

sdk.help = function(){
  console.log("Versal Gadget SDK");
  console.log("======================");
  console.log(" Known commands: ");
  console.log("   init");
  console.log("   validate");
  console.log("   compile");
};

sdk.test = function(argv){
  try {
    spawn("mocha", argv._, { stdio: 'inherit' });
  } catch(e) {
    console.error(e.message);
    console.error("Do you have mocha installed globally? Try running `npm install -g mocha`.");
    process.exit(e.code);
  }
}

sdk.compile = function(argv){
  var cwd = process.cwd();
  var requirejs = require("requirejs");
  var target = argv.dir || "dist";

  fs.removeSync(path.resolve(target));
  console.log("removed dist folder");

  var config = {
    name: "gadget", 
    baseUrl: cwd,
    out: target + '/gadget.js'
  };

  requirejs.optimize(config, function(buildResponse){

    fs.copy(path.join(cwd, "manifest.json"), path.join(cwd, target, "manifest.json"), function(err){
      if(err) {
        console.error(err);
      } else {
        console.log("manifest.json copied");
      }
    });

    fs.copy(path.join(cwd, "gadget.css"), path.join(cwd, target, "gadget.css"), function(err){
      if(err) {
        console.error(err);
      } else {
        console.log("gadget.css copied");
      }
    });

    fs.copy(path.join(cwd, "assets"), path.join(cwd, target, "assets"), function(err){
      if(err) {
        console.error(err);
      } else {
        console.log("assets copied");
      }
    });

  }, function(err){
    console.error(err);
  });
}

sdk.init = function(argv){
  var cwd = process.cwd();
  
  var dir = argv.dir || ".";
  var template = argv.template || "gadget-template-default";
  var gadget_name = argv.gadget || path.basename(cwd);
  var clean = argv.clean;

  var target_path = path.resolve(dir);
  var template_path = path.resolve(require.resolve(template), '../');
  if(argv.debug) template_path = "/Users/am/versal/gadget-template-default";
  var sdk_path = path.resolve(path.join(__dirname, "../lib/sdk"));

  console.log("create command has been issude inside" + cwd);
  console.log(" using template : " + template);
  console.log(" gadget name: " + gadget_name);
  console.log("cwd:" + cwd);
  console.log("dirname:" + __dirname);
  console.log("template path:" + template_path);
  console.log("dir path: " + target_path);

  fs.copy(template_path, target_path, function(err) {
    if(err) { 
      console.error(err);
    } else {
      console.log("template copied");
    }  });

  fs.copy(sdk_path, path.join(target_path, "sdk"), function(err){
    if(err) { 
      console.error(err);
    } else {
      console.log("sdk copied");
    }
  })
}

sdk.preview = function(argv){
  var dir = argv.dir || ".";
  var target_path = path.resolve(dir);
  var port = argv.port || 3000;
  var url = "http://localhost:" + port;

  var connect = require("connect");
  var http = require("http");

  var app = connect()
    .use(connect.static(target_path));

  http.createServer(app).listen(port);
  require("open")(url);
};

/// Validates the content of the specified directory
/// Ensures, that: 
/// - manifest.json is present
/// - manifest.json contains name of the gadget
/// - gadget.js file is present
sdk.validate = function(argv){
  var dir = argv.dir || "dist";

  assert.pathExists(path.join(dir, "manifest.json"));
  assert.pathExists(path.join(dir, "assets/"));
  assert.pathExists(path.join(dir, "assets/icon.png"));
  assert.pathExists(path.join(dir, "gadget.js"));
  assert.pathExists(path.join(dir, "gadget.css"));

  var manifestPath = path.resolve(path.join(dir, "manifest.json"));
  var manifest = require(manifestPath);
//TODO name, version, description and title are required
  assert(manifest.name, "Gadget manifest must contain name.");

  console.log("Gadget package validated successfully")
};