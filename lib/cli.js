(function() {
  module.exports = {
    create: function(dest, options) {
      var fn;
      console.log('create', dest);
      fn = require('./create/create');
      return fn(dest, options);
    },
    preview: function(dest, options) {
      var fn;
      if (!dest) {
        dest = '.';
      }
      console.log('preview', dest);
      fn = require('./preview/preview');
      return fn(dest, options);
    }
  };

}).call(this);
