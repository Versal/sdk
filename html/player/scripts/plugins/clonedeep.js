(function() {
  define([], function() {
    var cloneDeep;
    return cloneDeep = function(obj) {
      var k, tmp, v;
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      tmp = obj.constructor();
      for (k in obj) {
        v = obj[k];
        tmp[k] = cloneDeep(v);
      }
      return tmp;
    };
  });

}).call(this);
