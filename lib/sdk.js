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
  apiUrl: "http://stack.versal.com/api2",
  authUrl: "http://testing.versal.com/signin",
  basicAuth: {
    username: 'versal',
    password: 'm0n0sp4c3d'
  }
};

_.extend(sdk.configuration, {
  gadgetUploadUrl: sdk.configuration.apiUrl + "/gadgets",
  whoamiUrl: sdk.configuration.apiUrl + "/user",
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
  if (!cmd && argv.version) {
    console.log(require('../package.json').version);
  } else {
    sdk[cmd].call(null, argv);
  }
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
      wrench = require("wrench"),
      async = require("async"),
      callback = callback || sdk.getLogger("Gadget has been compiled successfully");
  fs.removeSync(distPath);
  fs.mkdirpSync(distPath);

  var config = {
    name: path.relative(srcPath, path.join(__dirname, "sdk/almond")),
    baseUrl: srcPath,
    out: function(text){
      sdk.writeGadget(sdk.wrapGadget(text), distPath + '/gadget.js');
    },
    include: ["gadget"],
    optimize: "none",
    paths: {
      text: "sdk/text",
      jquery: "empty:",
      backbone: "empty:",
      underscore: "empty:",
      // TODO: Make this dynamic
      "cdn.backbone": "empty:",
      "cdn.marionette": "empty:",
      "cdn.jquery": "empty:",
      "cdn.lodash": "empty:",
      "cdn.processing": "empty:",
      "cdn.raphael": "empty:",
      "cdn.jqueryui": "empty:"
    },
  };

  requirejs.optimize(config, function(buildResponse){
    async.parallel([
      function(cb) { fs.copy(fs.realpathSync(path.join(srcPath, "manifest.json")), path.join(distPath, "manifest.json"), cb); },
      function(cb) { fs.copy(fs.realpathSync(path.join(srcPath, "gadget.css")), path.join(distPath, "gadget.css"), cb); },
    ], function() {
      var opts = { inflateSymlinks: true };
      wrench.copyDirSyncRecursive(path.join(srcPath, "assets"), path.join(distPath, "assets"), opts);
      callback();
    });

  }, callback);
}

// TODO: Refactor this out to GadgetWrapper
sdk.writeGadget = function(code, dest) {
  fs.writeFileSync(path.resolve(dest), code);
}

// TODO: Refactor this out to GadgetWrapper
sdk.wrapGadget = function(code){
  var deps = sdk.extractDeps(code);
  return sdk.wrapCode(code, deps);
}

// TODO: Refactor this out to GadgetWrapper
// Inject dependencies from player into gadget
sdk.wrapCode = function(code, deps) {
  // Inject list of cdn.deps into root-level call of define
  // e.g.: define(['cdn.jquery', 'cdn.backbone'])
  var start = 'define([' + _.map(deps, function(dep){ return '\'' + dep + '\'' }).join(',') + '], function(){ ';
  if(deps) { start += 'var cdn = {}; '; }
  var end = '';

  // Insert defines for cdn dependencies
  for(var i in deps) {
    var dep = deps[i];
    // set property on local cdn object
    // e.g.: cdn.backbone = arguments[0];
    start += dep + ' = arguments[' + i + '];';
    // add define to the package
    // e.g.: define('cdn.backbone', [], function(){ return cdn.backbone; })
    end += 'define(\'' + dep + '\', [], function(){ return ' + dep + ' });\r\n';
  }

  end += 'return require(\'gadget\');';
  end += '});'

  code = start + code + end;
  return code;
}

// TODO: Refactor this out to GadgetWrapper
sdk.extractDeps = function(code) {
  var depFinder = /['"](cdn\.([^'"]+))['"]/g;
  var deps = [], match;

  while(match = depFinder.exec(code)) {
    deps.push(match[1]);
  }
  return _.uniq(deps);
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

sdk.register = function(options, callback) {
  var dir = options._.length > 0 ? options._[0] : ".",
      gadget_path = path.resolve(dir);
  sdk.registerGadget(options, gadget_path);
  callback = callback || sdk.getLogger("Gadget has been registered. Run 'versal preview' to preview it")
  return callback.call(this)
}

sdk.init = sdk.create = function(options, callback){
  var cwd = process.cwd(),
    dir = options._.length > 0 ? options._[0] : ".",
    template_name = options.template || 'static',
    gadget_path = path.resolve(dir),
    gadget_name = path.basename(gadget_path),

    sdk_path = path.join(__dirname, 'sdk'),
    callback = callback || sdk.getLogger("Gadget has been initialized successfully"),

    template_path = path.join(__dirname, '../templates/', template_name);

  var opts = {
    template_path: template_path,
    sdk_path: sdk_path,
    gadget_path: gadget_path,
    clean: options.clean,
    force: options.force
  };

  sdk.registerGadget(options, gadget_path);
  sdk.utils.initializer.initialize(opts, callback);
}

sdk.preview = function(argv){
  var dir = argv.dir || ".";
  var port = argv.port || 3000;
  var url = sdk.configuration.localhost + ":" + port;

  var connect = require("connect");
  var http = require("http");

  var app = connect()
    .use(require('./player-bridge')(sdk, {currentDir: process.cwd(), port:port}))
    .use(connect.static(path.resolve(__dirname)));

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
};

sdk.docs = function(argv){
  var dir = argv.dir || __dirname
  var target_path = path.resolve(dir);
  var port = argv.docsPort || 4000;
  var url = sdk.configuration.localhost + ":" + port;

  var connect = require("connect");
  var http = require("http");

  var app = connect()
    .use(connect.static(path.join(target_path, 'sdk', 'docs')));

  console.log("Docs are viewable at " + url);
  console.log("Press Control + C to exit.");

  http.createServer(app).listen(port);
};

sdk.publish = function(options, callback) {
  callback = callback || sdk.getLogger("Gadget published on " + sdk.configuration.apiUrl)

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

  needle.post(uploadUrl, { content: { buffer: fileData, filename: "bundle.zip", content_type: 'application/zip' }}, { multipart: true, headers: { "session_id": session_id }, timeout: 60000 }, function(err, res, errors){
    if(err) return callback.call(this, err);

    if(res.statusCode >= 300) {
      if(_.isArray(errors)) {
        var messages = _.map(errors, function(e){ return e.message; }).join(',');
        return callback.call(this, new Error("Following errors prevented the gadget from being uploaded: " + messages));
      } else {
        return callback.call(this, new Error("Gadget uploading failed. Error code: " + res.statusCode));
      }
    } else {
      return callback.call(this);
    }
  });
}

sdk.authorize = function(options, callback){
  callback = callback || sdk.getLogger("Authorized successfully");

  sdk.whoami(null, function(err, user){
    if(user && user.id) {
      callback.call(this);
    } else {
      if(options.email && options.password) {
        sdk.signin(options, callback);
      }

      var prompt = require('prompt'),
          promptParams = [
            { name: "email", message: "Email address:", required: true },
            { name: "password", message: "Password at Versal.com:", required: true, hidden: true }
          ];

      prompt.message = "";
      prompt.delimiter = "";

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
    data =  fs.readFileSync(keyPath, "utf8");
    var session_id = JSON.parse(data)["session"]
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
  var json;
  if (fs.existsSync(keyPath)) {
    data =  fs.readFileSync(keyPath, "utf8");
    json = JSON.parse(data)
    json["session"] = session_id;
  } else {
    json = {"session":session_id, "gadgets":[]};
  }
  fs.writeFileSync(keyPath, JSON.stringify(json));
}

sdk.registerGadget = function(options, gadgetPath) {
  var versalKeyPath = options.key || sdk.configuration.versalKeyPath,
      keyPath = path.resolve(versalKeyPath);

  var json;
  if (fs.existsSync(keyPath)) {
    data =  fs.readFileSync(keyPath, "utf8");
    json = JSON.parse(data)
    if (_.indexOf(json["gadgets"], gadgetPath) == -1) {
      json["gadgets"].push(gadgetPath);
    }
  } else {
    json = {"session":"", "gadgets":[gadgetPath]};
  }
  fs.writeFileSync(keyPath, JSON.stringify(json));
}

sdk.whoami = function(options, callback) {
  options = options || {};

  var needle = require('needle'),
      session_id = options.session_id || sdk.getSessionId(),
      callback = callback || sdk.getLogger("Your session is OK on " + sdk.configuration.apiUrl);

  if(!session_id) {
    return callback.call(this, new Error("SESSION_ID has not been found in ~/.versal. Provide your session in --session_id option."));
  }

  needle.get(sdk.configuration.whoamiUrl, { headers: { "SESSION_ID": session_id }}, function(err, res, body) {
    if(res.statusCode == 200)
      callback.call(this, err, body);
    else
      callback.call(this, err);
  });
}

sdk.signin = function(options, callback) {
  options = options || {};
  var needle = require("needle"),
      querystring = require("querystring"),
      callback = callback || sdk.getLogger("Signed in succesfully"),
      credentials = { email: options.email, password: options.password },
      data = querystring.stringify(credentials),
      requestOptions = _.extend({}, sdk.configuration.basicAuth);

  needle.post(sdk.configuration.authUrl, data, requestOptions, function(err, res, body) {
    if(err) { return callback.call(this, err); }
    if(res.statusCode != 200) { return callback.call(this, new Error("Authorization unsuccessful. Error code: " + res.statusCode)); }

    var session_id = res.headers["session_id"];
    sdk.saveSessionId(session_id);

    return callback.call(this, null, session_id);
  });
}

module.exports = sdk;
