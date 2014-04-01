(function() {
  var __slice = [].slice;

  define(['cdn.underscore'], function(_) {
    var deepIntersection;
    return deepIntersection = function() {
      var every, items, rest;
      items = arguments[0], rest = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      every = _.partial(_.every, rest);
      return _.filter(_.uniq(items), function(item) {
        var equalToItem;
        equalToItem = _.partial(_.isEqual, item);
        return every(function(other) {
          return _.any(other, equalToItem);
        });
      });
    };
  });

}).call(this);
