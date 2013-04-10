var path = require("path"),
    glob = require("glob"),
    fs = require("fs"),
    _ = require("lodash");

var validator = {
  manifestFields: [
    { name: "name", required: true, regex: /^[A-Za-z0-9-_]{2,}$/, message: "Manifest.json: name can contain only latin letters, numbers, dashes and underscores." },
    { name: "version", required: true, regex: /^\d+\.\d+\.\d+$/, message: "Manifest.json: version must be specified in format: X.X.X, where each X is a number." },
    { name: "description", required: true }
  ],

  requiredFiles: ["manifest.json", "assets/icon.png", "gadget.js", "gadget.css"]
};

validator.validate = function(gadgetPath) {
  if(!fs.existsSync(gadgetPath)) {
    throw new Error('Couldn\'t find ' + gadgetPath + '. Did you run `versal compile`?'.red);
  }

  var manifestPath = path.join(gadgetPath, "manifest.json");
  if(!fs.existsSync(manifestPath)) {
    throw new Error('Couldn\'t find manifest.json in ' + gadgetPath + '. Did you run `versal compile`?');
  }

  var manifest = require(manifestPath);
  var errors = validator.validateManifest(manifest);

  var files = glob.sync("**", { cwd: gadgetPath });
  errors = errors.concat(validator.validateFiles(files));

  return errors;
};

validator.validateFiles = function(files) {
  var required = validator.requiredFiles;

  var missing = _.difference(required, files);
  return _.map(missing, function(file){ return file + " is required, but not present in the gadget folder"; }) || [];
};

validator.validateManifest = function(manifest) {
  var fields = validator.manifestFields;
  var errors = [];

  var missing = _.reject(fields, function(field){ return !field.required || manifest.hasOwnProperty(field.name); });
  errors = errors.concat(_.map(missing, function(field){ return 'Manifest.json: manifest must contain "' + field.name + '"'; }));

  var wrongFormat = _.filter(fields, function(field) { return field.regex && (!manifest[field.name] || !manifest[field.name].match(field.regex)); });
  errors = errors.concat(_.map(wrongFormat, function(field){ return field.message; }));

  return errors;
};

module.exports = validator;
