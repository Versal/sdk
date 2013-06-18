(function() {
  var defaults, fs, https, needle, path, prompt, sdk, url, _;

  _ = require('underscore');

  fs = require('fs');

  url = require('url');

  prompt = require('prompt');

  https = require('https');

  sdk = require('../../lib/sdk');

  path = require('path');

  needle = require('needle');

  defaults = {
    url: "https://stack.versal.com/api2",
    authUrl: "http://www1.versal.com/signin",
    basicAuth: {
      username: 'versal',
      password: 'OkeyDokey'
    }
  };

  module.exports = {
    command: function(dest, options, callback) {
      var _this = this;
      if (callback == null) {
        callback = function() {};
      }
      options = _.extend(defaults, options);
      return this.verifySessionOrAuthenticate(options, function(err, sessionId) {
        var fileData, gadgetBundlePath;
        if (err) {
          return callback(err);
        }
        options.sessionId = sessionId;
        gadgetBundlePath = path.resolve("" + dest + "/bundle.zip");
        if (!fs.existsSync(gadgetBundlePath)) {
          callback(new Error("Gadget bundle not found in " + gadgetBundlePath + ". Did you run `versal compress`?"));
        }
        fileData = fs.readFileSync(gadgetBundlePath);
        console.log("Uploading gadget from " + dest + "...");
        return needle.post("" + options.url + "/gadgets", _this.requestData(fileData), _this.requestOptions(options.sessionId), function(err, res, errors) {
          var messages;
          if (err) {
            return callback(err);
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            return callback();
          }
          if (res.statusCode >= 300) {
            if (_.isArray(errors)) {
              messages = _.map(errors, function(e) {
                return e.message;
              }).join(',');
              return callback(new Error("Following errors prevented the gadget from being uploaded: " + messages));
            } else {
              return callback(new Error("Gadget uploading failed. Error code: " + res.statusCode));
            }
          }
        });
      });
    },
    requestData: function(fileData) {
      return {
        content: {
          buffer: fileData,
          filename: 'bundle.zip',
          content_type: 'application/zip'
        }
      };
    },
    requestOptions: function(sessionId) {
      return {
        multipart: true,
        headers: {
          session_id: sessionId
        },
        timeout: 60000
      };
    },
    verifySession: function(options, callback) {
      var requestOptions;
      requestOptions = {
        headers: {
          session_id: options.sessionId
        }
      };
      return needle.get("" + options.url + "/user", requestOptions, function(err, res, body) {
        if (res.statusCode === 200) {
          return callback();
        }
        if (err) {
          return callback(err);
        }
        return callback(new Error("Could not verify session"));
      });
    },
    signIn: function(options, callback) {
      var credentials, promptParams, querystring;
      querystring = require('querystring');
      credentials = {
        email: options.email,
        password: options.password
      };
      prompt = require('prompt');
      promptParams = [
        {
          name: "email",
          message: "Email address:",
          required: true
        }, {
          name: "password",
          message: "Password at Versal.com:",
          required: true,
          hidden: true
        }
      ];
      prompt.message = "";
      prompt.delimiter = "";
      console.log("Enter your Versal credentials to sign in:");
      return prompt.get(promptParams, function(err, credentials) {
        var data, requestOptions;
        _.extend(options, credentials);
        data = querystring.stringify(credentials);
        requestOptions = _.extend({}, options.basicAuth);
        return needle.post(options.authUrl, data, requestOptions, function(err, res, body) {
          var sessionId;
          if (err) {
            return callback(err);
          }
          if (res.statusCode !== 200) {
            return callback(new Error("Authorization unsuccessful. Error code: " + res.statusCode));
          }
          sessionId = res.headers["session_id"];
          return callback(null, sessionId);
        });
      });
    },
    verifySessionOrAuthenticate: function(options, callback) {
      var _this = this;
      return this.verifySession(options, function(err) {
        if (err) {
          return _this.signIn(options, callback);
        } else {
          return callback(null, options.sessionId);
        }
      });
    }
  };

}).call(this);
