(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette'], function(Marionette) {
    var FilteredCompositeView, _ref;
    return FilteredCompositeView = (function(_super) {
      __extends(FilteredCompositeView, _super);

      function FilteredCompositeView() {
        _ref = FilteredCompositeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      FilteredCompositeView.prototype._match = function(item) {
        var k, v, _ref1;
        _ref1 = this.filters;
        for (k in _ref1) {
          v = _ref1[k];
          if (v instanceof RegExp) {
            if (!item.get(k).match(v)) {
              return false;
            }
          } else {
            if (item.get(k) !== v) {
              return false;
            }
          }
        }
        return true;
      };

      FilteredCompositeView.prototype.addItemView = function(item) {
        if (this._match(item)) {
          return FilteredCompositeView.__super__.addItemView.apply(this, arguments);
        } else {
          return false;
        }
      };

      FilteredCompositeView.prototype.removeItemView = function(item) {
        if (this._match(item)) {
          return FilteredCompositeView.__super__.removeItemView.apply(this, arguments);
        } else {
          return false;
        }
      };

      return FilteredCompositeView;

    })(Marionette.CompositeView);
  });

}).call(this);
