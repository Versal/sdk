(function() {
  define([], function() {
    return function(priority) {
      return function(a, b) {
        var ca, cb, ha, hb, pa, pb;
        pa = priority.indexOf(a.get('title'));
        pb = priority.indexOf(b.get('title'));
        ca = a.get('catalog');
        cb = b.get('catalog');
        if (ca === 'approved' && cb === 'sandbox') {
          return -1;
        }
        if (ca === 'sandbox' && cb === 'approved') {
          return 1;
        }
        ha = a.get('hidden');
        hb = b.get('hidden');
        if (hb && !ha) {
          return -1;
        }
        if (ha && !hb) {
          return 1;
        }
        if (pa === pb) {
          return 0;
        }
        if (0 <= pb && pb < pa) {
          return 1;
        }
        if (pb >= 0 && pa < 0) {
          return 1;
        }
        return -1;
      };
    };
  });

}).call(this);
