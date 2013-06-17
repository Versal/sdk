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
      var fileData, gadgetBundlePath;
      if (callback == null) {
        callback = function() {};
      }
      options = _.extend(defaults, options);
      if (!options.sessionId) {
        throw new Error('sessionId is required');
      }
      gadgetBundlePath = path.resolve("" + dest + "/bundle.zip");
      if (!fs.existsSync(gadgetBundlePath)) {
        callback(new Error("Gadget bundle not found in " + gadgetBundlePath + ". Did you run `versal compress`?"));
      }
      fileData = fs.readFileSync(gadgetBundlePath);
      console.log("Uploading gadget from " + dest + "...");
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
