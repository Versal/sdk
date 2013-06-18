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
    authUrl: "http://www1.versal.com/signin"
  };

  module.exports = {
    command: function(dest, options, callback) {
      var _this = this;
      if (callback == null) {
        callback = function() {};
      }
      options = _.extend(defaults, options);
      return this.verifiedSessionId(options, function(sessionId) {
        var fileData, gadgetBundlePath;
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
    verifySessionId: function(options, callback) {
      options = {
        headers: {
          session_id: options.sessionId
        }
      };
      return needle.get("" + options.url + "/user", options, function(err, res, body) {
        console.log(err);
        if (res.statusCode === 200) {
          return callback(options.sessionId);
        } else {
          return callback();
        }
      });
    },
    obtainSessionId: function(options, callback) {
      var credentials, data, promptParams, querystring, requestOptions;
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
          required: true,
          name: "password",
          message: "Password at Versal.com:",
          required: true,
          hidden: true
        }
      ];
      prompt.message = "";
      prompt.delimiter = "";
      console.log("Enter your Versal credentials to sign in:");
      prompt.get(promptParams, function(err, credentials) {
        return _.extend(options, credentials);
      });
      data = querystring.stringify(credentials);
      requestOptions = {};
      console.log(options.authUrl);
      return needle.post(options.authUrl, data, requestOptions, function(err, res, body) {
        var sessionId;
        if (err) {
          return callback(err);
        }
        if (res.statusCode !== 200) {
          return callback(new Error("Authorization unsuccessful. Error code: " + res.statusCode));
        }
        sessionId = res.headers["session_id"];
        return callback(sessionId);
      });
    },
    verifiedSessionId: function(options, callback) {
      var _this = this;
      return this.verifySessionId(options, function(sessionId) {
        if (!sessionId) {
          return _this.obtainSessionId(options, function(sessionId) {
            return callback(sessionId);
          });
        } else {
          return callback();
        }
      });
    }
  };

}).call(this);
