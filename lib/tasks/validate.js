var mocha = require("mocha"),
    path = require("path"),
    fs = require("fs"),
    colors = require("colors");

validator.validatePath = function(src, errors){
  if(!fs.existsSync(src)) {
    errors.push("Path " + src + " does not exists");
  }
}

var validator = module.exports = {};

validator.validationRegexes = {
  // Gadget name is a unique identifier of the gadget for the user.
  // Name allows only latin letters, numbers, "-" and "_".
  name: /^[A-Za-z0-9-_]{2,}$/,

  // Version is a subset of semver.
  // 0.1.2 format is supported, where 0 - major version, 1 - minor version, 2 - revision
  version: /^\d+\.\d+\.\d+$/
}

describe("Gadget validation", function() {

});

validator.validate = function(argv) {
  var dir = argv.dir || "dist";
  var gadgetPath = path.resolve(dir);
  var manifestPath = path.resolve(path.join(gadgetPath, "manifest.json"));
  var manifest = require(manifestPath);

  var errors = validator.validateFolder(gadgetPath);
  if(manifest) {
    errors = Array.concat(validator.validateManifest(manifest));
  } else {
    errors.push("Manifest.json not found. Cannot continue.");
  };

  if(errors.length) {
    for(var e in errors) {
      console.log(e.red);
    }
  } else {
    console.log("Your gadget is validated successfully and ready for publishing.\nRun versal publish to publish the gadget.\n Good job!".green);
  }

};

validator.validateFolder = function(gadgetPath) {
  var errors = [];
  
  validator.validatePath(path.join(gadgetPath, "manifest.json"), errors);
  validator.validatePath(path.join(gadgetPath, "assets/"), errors);
  validator.validatePath(path.join(gadgetPath, "assets/icon.png"), errors);
  validator.validatePath(path.join(gadgetPath, "gadget.js"), errors);
  validator.validatePath(path.join(gadgetPath, "gadget.css"), errors);

  return errors ? errors : null;
};

validator.validateManifest = function(manifest) {
  var errors = [];
  
  validator.validatePresence(manifest.name, "Gadget manifest must contain name.", errors);
  validator.validatePresence(manifest.version, "Gadget manifest must contain version in 0.1.2 format.", errors);
  validator.validatePresence(manifest.description, "Gadget manifest must contain human-readable description.", errors);

  validator.validatePresence(manifest.name.match(validationRegexes.name), "Gadget name must contain only english letters, numbers, dash and underscore (e.g. foo-gadget)");

  return errors ? errors : null;
};