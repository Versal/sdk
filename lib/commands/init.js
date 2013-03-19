var path = require('path'),
    fs = require('fs'),
    ncp = require('ncp'),
    assert = require('assert'),
    async = require('async');

// Options:
// gadget_path    path to the gadget folder. Will be created if not exists.
// template_path  path to the template folder. Required.
// sdk_path       path to the sdk folder. Required.
module.exports = function(options, callback){
  assert.ok(options, "You must provide options for init task");
  assert.ok(options.template_path, 'template_path option is required');
  assert.ok(options.sdk_path, 'sdk_path option is required');
  assert.ok(options.gadget_path, 'gadget_path option is required');

  callback = callback || function(){};

  var template_path = path.resolve(options.template_path);
  var sdk_path = path.resolve(options.sdk_path);
  var gadget_path = path.resolve(options.gadget_path);
  var clobber = options.overwrite || false;

  assert.ok(fs.existsSync(template_path), 'Template not found in "' + template_path + '"');
  assert.ok(fs.existsSync(sdk_path), 'SDK not found in "' + sdk_path + '"');

  //test mode - dont actually run anything
  if(options.test) { return callback.call(this); }

  if(!fs.existsSync(gadget_path)) {
    fs.mkdirSync(gadget_path);
  }

  async.parallel([
    //Gadget files will get overriden only if --override option is specified
    function(cb) { ncp(template_path, gadget_path, { clobber: clobber }, cb); },
    //SDK files will get overriden allways
    function(cb) { ncp(sdk_path, path.join(gadget_path, 'sdk'), cb); },
  ], function(err) {
    callback.call(this, err);
  });
}