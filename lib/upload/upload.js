(function() {
  var api, fs, path, sdk;

  fs = require('fs');

  sdk = require('../../lib/sdk2');

  api = require('js-api');

  path = require('path');

  module.exports = function(dest, options, callback) {
    var gadget, gadgetBundlePath;
    if (options == null) {
      options = {};
    }
    if (callback == null) {
      callback = function() {};
    }
    if (!options.sessionId) {
      throw new Error('sessionId is required');
    }
    api.init({
      sessionId: options.sessionId,
      sessionIdKey: 'SID',
      apiUrl: 'http://localhost:8082'
    });
    gadgetBundlePath = path.resolve("" + dest + "/bundle.zip");
    if (!fs.existsSync(gadgetBundlePath)) {
      callback(new Error("Gadget bundle not found in " + gadgetBundlePath + ". Did you run `versal compress`?"));
    }
    console.log("Uploading gadget from " + dest + "...");
    gadget = new api.GadgetProject;
    return gadget.save({
      content: fs.readFileSync(gadgetBundlePath)
    }, {
      upload: true,
      success: function(model) {
        console.log('Gadget uploaded successfully');
        return callback();
      },
      error: function(err) {
        console.log('bad');
        return callback(err);
      }
    });
  };

}).call(this);
