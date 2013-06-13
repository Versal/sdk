(function() {
  var __slice = [].slice;

  module.exports = {
    exec: function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this[command].apply(null, args);
    },
    create: function() {
      return require('./create/create')(arguments);
    },
    preview: function() {
      return require('./preview/preview')(arguments);
    },
    compile: function() {
      return require('./compile/compile')(arguments);
    }
  };

}).call(this);
