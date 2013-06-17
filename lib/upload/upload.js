(function() {
  var defaults, fs, needle, path, sdk, _;

  _ = require('underscore');

  fs = require('fs');

  sdk = require('../../lib/sdk');

  path = require('path');

  needle = require('needle');

  defaults = {
    url: "https://stack.versal.com/api2"
  };

  module.exports = {
    command: function(dest, options, callback) {
      var bundlePath;
      if (callback == null) {
        callback = function() {};
      }
      options = _.extend(defaults, options);
      if (!options.sessionId) {
        throw new Error('sessionId is required');
      }
      bundlePath = path.resolve("" + dest + "/bundle.zip");
      if (fs.existsSync(bundlePath)) {
        return this.upload(bundlePath, options, callback);
      } else {
        return sdk.validate(bundlePath, function(err) {
          if (err) {
            return callback(new Error("bundle.zip not found in " + bundlePath + ". Is this a valid gadget folder?"));
          }
          return sdk.compress(bundlePath, function(err) {
            if (err) {
              return callback(err);
            }
            return this.upload(bundlePath, options, callback);
          });
        });
      }
    },
    upload: function(bundlePath, options, callback) {
      var fileData;
      console.log("Uploading gadget from " + dest + "...");
      fileData = fs.readFileSync(bundlePath);
      return needle.post("" + options.url + "/gadgets", this.requestData(fileData), this.requestOptions(options.sessionId), function(err, res, errors) {
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
    }
  };

}).call(this);
