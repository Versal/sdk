var path = require('path'),
    fs = require('fs-extra'),
    ncp = require('ncp'),
    assert = require('assert'),
    glob = require('glob');

var initializer = {};

// Options:
// gadget_path    path to the gadget folder. Will be created if not exists.
// template_path  path to the template folder. Required.
// sdk_path       path to the sdk folder. Required.
initializer.initialize = function(options, callback){
  assert.ok(options, "You must provide options for init task");

  assert.ok(options.template_path, 'template_path option is required');
  assert.ok(options.sdk_path, 'sdk_path option is required');
  assert.ok(options.gadget_path, 'gadget_path option is required');

  callback = callback || function(){};

  var template_path = path.resolve(options.template_path);
  var sdk_path = path.resolve(options.sdk_path);
  var gadget_path = path.resolve(options.gadget_path);

  var force = options.force || false;
  var clean = options.clean || false;

  assert.ok(fs.existsSync(template_path), 'Template not found in "' + template_path + '"');
  assert.ok(fs.existsSync(sdk_path), 'SDK not found in "' + sdk_path + '"');

  //test mode - dont actually run anything
  if(options.test) { return callback.call(this); }
  
  if(clean) {
    glob.sync('**', { cwd: gadget_path }).forEach(function(f){ fs.removeSync(path.join(gadget_path, f)); });
  }

  if(!fs.existsSync(gadget_path)) {
    fs.mkdirSync(gadget_path);
  }

  if(fs.existsSync(path.join(gadget_path, 'sdk'))) {
    fs.removeSync(path.join(gadget_path,'sdk'));
  }

  ncp(sdk_path, path.join(gadget_path, 'sdk'), function(err){
    if(err) callback.call(this, err);

    ncp(template_path, gadget_path, { clobber: force, filter: initializer.filter }, callback);
  });
};

initializer.ignoredFiles = ['package.json'];

initializer.filter = function(file){
  for(var i in initializer.ignoredFiles){
    var ignoredFile = initializer.ignoredFiles[i];
    if(file.indexOf(ignoredFile, file.length - ignoredFile.length) !== -1)
      return false;
  }
  return true;
}

module.exports = initializer;