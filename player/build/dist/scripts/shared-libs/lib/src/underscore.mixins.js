define([], function() {
  var cloneDeep = function (obj) {
    if (obj === null || typeof obj !== 'object') return obj;

    var tmp = obj.constructor();

    for (var k in obj) {
      tmp[k] = cloneDeep(obj[k]);
    }
    return tmp;
  };

  return {
    cloneDeep: cloneDeep
  };
});
