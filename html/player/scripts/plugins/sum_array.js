(function() {
  define(['cdn.underscore'], function(_) {
    var sumArray;
    return sumArray = function(obj) {
      if (!_.isArray(obj)) {
        throw new Error('argument must be an array');
      }
      if (!_.all(obj, _.isNumber)) {
        throw new Error('argument must be an array of numbers');
      }
      return _.reduce(obj, function(sum, n) {
        return sum += n;
      }, 0);
    };
  });

}).call(this);
