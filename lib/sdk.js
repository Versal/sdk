var sdk = module.exports = {};
var path = require("path"); 
var spawn = require("child_process").spawn;
var fs = require("fs-extra")

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
  var sdk_path = path.resolve(path.join(__dirname, "../lib/sdk"));

  console.log("create command has been issued in " + cwd);
  console.log(" using template : " + template);
  console.log(" gadget name: " + gadget_name);
  console.log("cwd: " + cwd);
  console.log("dirname: " + __dirname);
  console.log("template path: " + template_path);
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


sdk.authorize = function(argv){
  var login = argv.login;
  var password = argv.password;

  var prompt = require('prompt');
  var promptParams = [];

  //For consistency, require both parameters
  if(!login || !password) {
    promptParams.push({ name: "email", description: "Email address", required: true });
    promptParams.push({ name: "password", description: "Password at Versal.com", required: true, hidden: true });
  }

  if(promptParams.length){
    console.log("Enter your Versal credentials to authorize:");
    prompt.get(promptParams, function(err, credentials) {
      console.log(credentials);
    });
  };
}
