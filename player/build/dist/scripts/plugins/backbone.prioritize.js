(function() {

  define(['cdn.backbone'], function(Backbone) {
    return Backbone.Collection.prototype.prioritize = function(qualities) {
      var model, q, _i, _len, _ref, _results;
      _ref = qualities.reverse();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        q = _ref[_i];
        this.remove(model = this.findWhere(q));
        if (model) {
          _results.push(this.push(model));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
  });

}).call(this);
