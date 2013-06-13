(function() {
  var grunt, path, _;

  grunt = require('grunt');

  path = require('path');

  _ = require('underscore');

  grunt.task.init = function() {};

  module.exports = _.extend(grunt, {
    loadGruntTask: function(name) {
      var root, tasksdir;
      root = path.resolve(path.join(__dirname, '../node_modules'));
      tasksdir = path.join(root, name, 'tasks');
      console.log(tasksdir);
      if (grunt.file.exists(tasksdir)) {
        return grunt.loadTasks(tasksdir);
      } else {
        return grunt.log.error('Local Npm module "' + name + '" not found. Is it installed?');
      }
    }
  });

}).call(this);
