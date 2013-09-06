(function() {
  var __slice = [].slice;

  define([], function() {
    var Channel;
    return Channel = (function() {

      function Channel() {
        this._subscribers = [];
        this.channels = {};
      }

      Channel.prototype.on = function(callback, context) {
        var subscriber;
        if (context == null) {
          context = this;
        }
        subscriber = {
          context: context,
          callback: callback
        };
        return this._subscribers.push(subscriber);
      };

      Channel.prototype.off = function(callback, context) {
        var i, sub, _i, _ref, _results;
        if (context == null) {
          context = null;
        }
        _results = [];
        for (i = _i = _ref = this._subscribers.length - 1; _i >= 0; i = _i += -1) {
          sub = this._subscribers[i];
          if (!callback) {
            _results.push(this._subscribers.splice(i, 1));
          } else if (sub.callback === callback) {
            if (!(context != null) || sub.context === context) {
              _results.push(this._subscribers.splice(i, 1));
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Channel.prototype.trigger = function() {
        var data, sub, _i, _len, _ref, _results;
        data = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _ref = this._subscribers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          _results.push(sub.callback.apply(sub.context, data));
        }
        return _results;
      };

      return Channel;

    })();
  });

}).call(this);
