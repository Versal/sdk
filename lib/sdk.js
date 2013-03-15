var sdk = module.exports = {};
var path = require("path"); 
var spawn = require("child_process").spawn;
var fs = require("fs-extra")

sdk.configuration = {
  gadgetUploadUrl: "http://beta.versal.com/api/gadgets",
  frontdoorUrl: "http://beta.versal.com/frontdoor/signin",
  localhost: "http://localhost"
}


sdk.exec = function(cmd, argv){
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

  var config = {
    name: "gadget", 
    baseUrl: cwd,
    out: target + '/gadget.js',
    paths: {
      jquery: "empty:",
      backbone: "empty:",
      underscore: "empty:"
    }
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

sdk.compress = function(argv) {
  var cwd = process.cwd();
  var dir = argv.dir || "dist";
  var distPath = path.join(cwd, dir);
  var bundlePath = path.join(cwd, "bundle.zip");

  var fs = require('fs');
  var glob = require('glob');
  var archiver = require('archiver');

  var output = fs.createWriteStream(bundlePath);
  if(fs.existsSync(bundlePath)) {
    fs.unlinkSync(bundlePath);
  }

  var archive = archiver('zip');

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  glob("**/*.*", { cwd: distPath }, function(err, files){
    console.log(files);
    for(var i in files) {
      var fileName = files[i];
      if(fileName) {
        console.log(fileName);
        archive.append(fs.createReadStream(fileName), { name: fileName });
      }
    }

    archive.finalize(function(err, written) {
      if (err) throw err;

      console.log(written + ' total bytes written');
    });
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
  var url = sdk.configuration.localhost + ":" + port;

  var connect = require("connect");
  var http = require("http");

  var app = connect()
    .use(connect.static(target_path));

  console.log("Server is started on " + url);
  console.log("Press Control + C to exit.");

  http.createServer(app).listen(port);
  require("open")(url);
};

sdk.publish = function(argv) {
  var email = argv.email;
  var password = argv.password;

  var prompt = require('prompt');
  var promptParams = [];

  //For consistency, require both parameters
  if(!email || !password) {
    promptParams.push({ name: "email", description: "Email address", required: true });
    promptParams.push({ name: "password", description: "Password at Versal.com", required: true, hidden: true });
  }

  if(promptParams.length){
    console.log("Enter your Versal credentials to authorize:");
    prompt.get(promptParams, function(err, credentials) {
      sdk.authorize(credentials, sdk.upload);
    });
  } else {
    var credentials = { email: email, password: password };
    sdk.authorize(credentials, sdk.upload);
  }
};

sdk.upload = function(argv) {
  var session_id;

  if(typeof(argv) === "string") {
    session_id = argv;
  } else if(argv && argv.session_id) {
    session_id = argv.session_id;
  } else {
    throw new Error("session_id is required to upload a gadget.");
  }

  var cwd = process.cwd();
  //TODO: Invent better way to get the bundle path
  var dir = "dist";
  var distPath = path.join(cwd, dir);
  var bundlePath = path.join(cwd, "bundle.zip");

  var uploadUrl = sdk.configuration.gadgetUploadUrl;
  var needle = require("needle");
  //TODO: File is read synchronously. Is there a way to pipe it to request?
  var fileData = fs.readFileSync(bundlePath);

  needle.post(uploadUrl, { content: { buffer: fileData, filename: "bundle.zip", content_type: 'application/zip' }}, { multipart: true, headers: { "session_id": session_id } }, function(err, res){
    console.log(res.statusCode);
  });
}

sdk.authorize = function(credentials, success){
  var http = require("http");
  var querystring = require("querystring");
  var credentials = { email: credentials.email, password: credentials.password };
  var data = querystring.stringify(credentials);

  var needle = require("needle");
  var success = success || function(err, session_id){ if(err) { console.log(err); } else { console.log(session_id); }};

  needle.post(sdk.configuration.frontdoorUrl, data, function(err, res) {
    if(res.statusCode == 200 && res.headers["session_id"]) {
      if(success) { success.call(null, {session_id: res.headers["session_id"] }); }
    } else {
      console.log("Could not authorize. Status code: " + res.statusCode);
    }
  });
}
