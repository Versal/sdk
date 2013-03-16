var path = require("path"),
    colors = require("colors"),
    glob = require("glob"),
    _ = require("lodash");

var validator = module.exports = {};

validator.manifestFields = [
  { name: "name", required: true, regex: /^[A-Za-z0-9-_]{2,}$/, message: "Gadget name can contain only latin letters, numbers, dashes and underscores." },
  { name: "version", require: true, regex: /^\d+\.\d+\.\d+$/, message: "Gadget version must be specified in format: X.X.X, where each X is a number." }
];


validator.validate = function(gadgetPath) {
  var manifestPath = path.resolve(path.join(gadgetPath, "manifest.json"));
  var manifest = require(manifestPath);

  var errors = validator.validateFolder(gadgetPath);
  if(manifest) {
    errors = errors.concat(validator.validateManifest(manifest));
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

validator.validateFolder = function(gadgetPath, callback) {
  var required = ["manifest.json", "assets/icon.png", "gadget.js", "gadget.css"];
  var present = glob("**", { cwd: gadgetPath} , function(err, files) {
    if(err) { throw err; }

    var missing = _.difference(required, present)
      .map(missing, function(file){ file + " is required, but not present in the gadget folder"; });

    if(callback) { 
      callback.apply(null, missing.concat(wrongFormat));
    }
  });
};

validator.validateManifest = function(manifest, callback) {
  var fields = validator.manifestFields;
  var errors = [];

  var missing = _.reject(fields, function(field){ return !field.required || manifest.hasOwnProperty(field.name); })
    .map(function(field){ 'Manifest.json must contain "' + field + '"'; });

  var wrongFormat = _.reject(fields, function(field) { return !field.regex || (manifest[field] && manifest[field].match(field.regex)); })
    .map(function(field){ return field.message; })

  if(callback) { 
    callback.apply(null, missing.concat(wrongFormat)); 
  }
};