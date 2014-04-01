(function() {
  define([], function() {
    return function(date) {
      var diff, label, max, min, unit, unitCount, _i, _len, _ref, _ref1;
      diff = (+(new Date)) - date;
      if (diff <= 30 * 1000) {
        label = 'seconds';
      } else if ((30 * 1000 < diff && diff <= 60 * 1000)) {
        label = 'less than a minute';
      } else {
        _ref = [['minute', 60 * 1000, 60 * 60 * 1000], ['hour', 60 * 60 * 1000, 24 * 60 * 60 * 1000], ['day', 24 * 60 * 60 * 1000, Infinity]];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], unit = _ref1[0], min = _ref1[1], max = _ref1[2];
          if ((min < diff && diff <= max)) {
            unitCount = Math.floor(diff / min);
            label = "" + unitCount + " " + unit;
            if (unitCount > 1) {
              label += 's';
            }
          }
        }
      }
      return label;
    };
  });

}).call(this);
