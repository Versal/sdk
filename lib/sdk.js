var path = require("path"); 
var cp = require("child_process");
var fs = require("fs-extra");
var _ = require("lodash");
var colors = require("colors");

var sdk = {};
sdk.utils = {};

sdk.utils.initializer = require('./commands/init');
sdk.utils.validator = require('./commands/validate');

sdk.getHomeDirectory = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

sdk.configuration = { 
  rootUrl: "http://testbeta.versal.com"
};

_.extend(sdk.configuration, {
  gadgetUploadUrl: sdk.configuration.rootUrl + "/api/gadgets",
  frontdoorUrl: sdk.configuration.rootUrl + "/frontdoor/signin",
  aliveUrl: sdk.configuration.rootUrl + "/api/alive",
  localhost: "http://localhost",
  versalKeyPath: path.join(sdk.getHomeDirectory(),'.versal')
});

process.on("uncaughtException", function(err){
  console.log(err.message);
})

sdk.getLogger = function(message){
  return function(err) {
    if(err) {
      if(err.message) { 
        console.log(err.message.red); 
      } else { 
        console.log("Unknown error".red)
      }
    } else {
      console.log(message.green);
    }
  };
};

sdk.exec = function(cmd, argv){
  sdk[cmd].call(null, argv);
}

sdk.test = function(argv){
  var child = cp.exec('mocha' + (argv._ || ''), function(err, stdout, stderr){
    if(err){
      if(err.message.match(/command not found/))
      {
        console.log("Mocha not found.".yellow)
        console.log("Do you have mocha installed globally? Try running `npm install -g mocha`.".yellow);
      }
      else {
        console.log(err.message.red);
      }
    }
  });

  child.stdout.pipe(process.stdout);
}

sdk.validate = function(options, callback){
  var dist = options.dist || "dist",
      compiledPath = path.resolve(dist),
      callback = callback || function(err) {
        if(!err) {
          console.log("Gadget successfully validated!".green);
        } else {
          console.log(err.message.red);
        }
      };

  var errors = sdk.utils.validator.validate(compiledPath);
  if(errors.length == 0){
    return callback.call(this, null, options);
  } else {
    errors.unshift('Validation unsuccessful. Errors: ');
    
    var aggregatedErrorMessage = errors.join('\n');
    return callback.call(this, new Error(aggregatedErrorMessage));
  }
}

sdk.clean = function(options, callback) {
  var src = options.src || '.',
      srcPath = path.resolve(src),
      dist = options.dist || 'dist',
      distPath = path.resolve(dist),
      bundlePath = path.join(srcPath, 'bundle.zip'),
      callback = callback || sdk.getLogger("Cleaned up successfully.");

  fs.remove(distPath, function(err){
    if(err) return callback.call(this, err);

    if(fs.existsSync(bundlePath)) {
      fs.unlink(bundlePath, callback);
    } else {
      callback.call(this);
    }
  });
}

sdk.compile = function(options, callback){
  var src = options.src || ".",
      dist = options.dist || "dist",
      srcPath = path.resolve(src),
      distPath = path.resolve(dist),
      requirejs = require("requirejs"),
      async = require("async"),
      callback = callback || sdk.getLogger("Gadget has been compiled successfully");

  fs.removeSync(distPath);

  //TODO: Implement another loader
  var config = {
    //TODO: We have to include Almond with each gadget. That adds ~16Kb to gadget weight.
    name: "sdk/almond", 
    baseUrl: srcPath,
    out: distPath + '/gadget.js',
    include: ["gadget"],
    optimize: "none",
    paths: {
      text: "sdk/text",
      jquery: "empty:",
      backbone: "empty:",
      underscore: "empty:"
    },
    wrap: {
      start: "define([], function(){",
      end: ['var g;','require(["gadget"], function(gadget){ g=gadget; }, false, true);','return g;','});'].join('\r\n')
    }
  };

  requirejs.optimize(config, function(buildResponse){
    async.parallel([
      function(cb) { fs.copy(path.join(srcPath, "manifest.json"), path.join(distPath, "manifest.json"), cb); },
      function(cb) { fs.copy(path.join(srcPath, "gadget.css"), path.join(distPath, "gadget.css"), cb); },
      function(cb) { fs.copy(path.join(srcPath, "assets"), path.join(distPath, "assets"), cb); }
    ], callback);
  }, callback);
}

sdk.compress = function(options, callback) {
  var src = options.src || ".",
      dist = options.dist || "dist",
      srcPath = path.resolve(src),
      distPath = path.resolve(dist),
      bundlePath = path.join(srcPath, "bundle.zip"),
      callback = callback || sdk.getLogger("Gadget has been compressed successfully");

  if(fs.existsSync(bundlePath)) {
    fs.unlinkSync(bundlePath);
  }

  var glob = require('glob');
  var archiver = require('archiver');

  var output = fs.createWriteStream(bundlePath);
  var archive = archiver('zip');

  archive.on('error', callback);
  archive.pipe(output);

  glob("**/*.*", { cwd: distPath }, function(err, files){
    if(err) {
      return callback.call(this, err);
    }

    for(var i in files) {
      var fileName = files[i];
      var filePath = path.join(distPath, fileName);
      if(filePath) {
        archive.append(fs.createReadStream(filePath), { name: fileName });
      }
    }

    archive.finalize(callback);
  });
}

sdk.init = sdk.create = function(options, callback){
  var cwd = process.cwd(),
    dir = options._.length > 0 ? options._[0] : ".",
    template_name = options.template || "gadget-template-default",
    gadget_path = path.resolve(dir),
    gadget_name = path.basename(gadget_path),
    sdk_path = path.join(__dirname, 'sdk'),
    callback = callback || sdk.getLogger("Gadget has been initialized successfully");

  //callback = ;
  //TODO : add test for that
  if(sdk.configuration.templateRoot) {
    template_path = path.join(path.resolve(sdk.configuration.templateRoot), template_name);
  } else {
    template_path = path.resolve(require.resolve(template_name), '../');
  }

  var opts = {
    template_path: template_path,
    sdk_path: sdk_path,
    gadget_path: gadget_path,
    clean: options.clean,
    force: options.force
  };

  sdk.utils.initializer.initialize(opts, callback);
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

sdk.publish = function(options, callback) {
  callback = callback || sdk.getLogger("Gadget published successfully")

  sdk.compile(options, function(err){
    if(err) return callback.call(this, err);

    sdk.validate(options, function(err){
      if(err) return callback.call(this, err);

      sdk.compress(options, function(err){
        if(err) return callback.call(this, err);

        sdk.authorize(options, function(err){
          if(err) return callback.call(this, err);

          sdk.upload(options, callback);
        });
      });
    });
  });
};

sdk.upload = function(options, callback) {
  callback = callback || sdk.getLogger("Gadget uploaded successfully");

  var src = options.src || ".",
      session_id = options.session_id || sdk.getSessionId(),
      srcPath = path.resolve(src),
      bundlePath = path.join(srcPath, "bundle.zip"),
      uploadUrl = sdk.configuration.gadgetUploadUrl;

  if(!session_id) {
    callback.call(this, new Error("session_id is required to upload a gadget."));
  }

  //TODO: Invent better way to get the bundle path
  var needle = require("needle");
  //TODO: File is read synchronously. Is there a way to pipe it to request?
  var fileData = fs.readFileSync(bundlePath);

  needle.post(uploadUrl, { content: { buffer: fileData, filename: "bundle.zip", content_type: 'application/zip' }}, { multipart: true, headers: { "session_id": session_id } }, function(err, res, errors){
    if(err) return callback.call(this, err);

    if(res.statusCode >= 300) {
      if(_.isArray(errors)) {
        var messages = _.map(errors, function(e){ return e.message; }).join(',');
        return callback.call(this, new Error("Following errors prevented the gadget from being uploaded: " + messages));
      } else {
        return callback.call(this, new Error("Gadget uploading failed. Error code: " + es.statusCode));
      }
    } else {
      return callback.call(this);
    }
  });
}

sdk.authorize = function(options, callback){
  callback = callback || sdk.getLogger("Authorized successfully");

  sdk.alive(null, function(err, alive){
    if(alive) { 
      callback.call(this); 
    } else {
      if(options.email && options.password) {
        sdk.signin(options, callback);
      }

      var prompt = require('prompt'),
          promptParams = [
            { name: "email", description: "Email address", required: true },
            { name: "password", description: "Password at Versal.com", required: true, hidden: true }
          ];

      console.log("Enter your Versal credentials to sign in:");
      prompt.get(promptParams, function(err, credentials) {
        _.extend(options, credentials);
        sdk.signin(options, callback);
      });
    }
  });
};

sdk.getSessionId = function(options) {
  options = options || {};
  var versalKeyPath = options.key || sdk.configuration.versalKeyPath,
      keyPath = path.resolve(versalKeyPath),
      endpoint = options.endpoint || sdk.configuration.gadgetUploadUrl;
  
  if(fs.existsSync(keyPath)) {
    var session_id =  fs.readFileSync(keyPath, "utf8");
    return session_id;
  }
}

sdk.clearSessionId = function(options) {
  options = options || {};
  var versalKeyPath = options.key || sdk.configuration.versalKeyPath,
      keyPath = path.resolve(versalKeyPath);
  
  fs.unlinkSync(keyPath);
}

sdk.saveSessionId = function(options) {
  options = options || {};
  var versalKeyPath = options.key || sdk.configuration.versalKeyPath,
      keyPath = path.resolve(versalKeyPath),
      endpoint = options.endpoint || sdk.configuration.gadgetUploadUrl,
      session_id = typeof(options) === "string" ? options : options.session_id;

  if(!session_id) { return; }

  fs.writeFileSync(keyPath, session_id);
}

sdk.alive = function(options, callback) {
  options = options || {};

  var needle = require('needle'),
      session_id = options.session_id || sdk.getSessionId(),
      callback = callback || sdk.getLogger("Your session is alive!");

  if(!session_id) {
    return callback.call(this, new Error("SESSION_ID has not been found in ~/.versal. Provide your session in --session_id option."));
  }

  needle.get(sdk.configuration.aliveUrl, { headers: { "SESSION_ID": session_id }}, function(err, res, body) {
    callback.call(this, err, res.statusCode == 200);
  });
}

sdk.signin = function(options, callback) {
  options = options || {};
  var needle = require("needle"),
      querystring = require("querystring"),
      callback = callback || sdk.getLogger("Signed in succesfully"),
      credentials = { email: options.email, password: options.password },
      data = querystring.stringify(credentials);

  needle.post(sdk.configuration.frontdoorUrl, data, function(err, res, body) {
    if(err) { return callback.call(this, err); }
    if(res.statusCode != 200) { return callback.call(this, new Error("Authorization unsuccessful. Error code: " + res.statusCode)); }

    var session_id = res.headers["session_id"];
    sdk.saveSessionId(session_id);
    
    return callback.call(this, null, session_id);
  });
}

module.exports = sdk;
