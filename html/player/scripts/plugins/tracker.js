(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.underscore', 'cdn.jquery', 'models/settings'], function(_, $, settings) {
    var Timer, Tracker, interval, queue, save, throttledSave, _ref;
    queue = [];
    interval = ((_ref = settings.get('tracker')) != null ? _ref.interval : void 0) || 20000;
    save = function() {
      var oldQueue, path, _ref1, _ref2;
      path = (_ref1 = settings.get('tracker')) != null ? _ref1.path : void 0;
      if (!path || queue.length < 1) {
        return false;
      }
      oldQueue = _.clone(queue);
      return $.ajax({
        type: 'POST',
        url: path,
        contentType: 'application/json',
        data: JSON.stringify(queue),
        success: function() {
          return queue = _.difference(queue, oldQueue);
        },
        headers: (_ref2 = settings.get('tracker')) != null ? _ref2.headers : void 0
      });
    };
    throttledSave = _.throttle(save, interval, {
      leading: false
    });
    Timer = (function() {
      function Timer(opts) {
        this._name = opts.name || '';
        this._initialData = opts.data || {};
        this._stopCb = opts.done || (function() {});
        this._startTime = this._currentTime();
      }

      Timer.prototype.stop = function(finalData) {
        return this._stopCb({
          name: this._name,
          data: _.extend({}, this._initialData, finalData),
          duration: this._currentTime() - this._startTime
        });
      };

      Timer.prototype._currentTime = function() {
        return (new Date).getTime();
      };

      return Timer;

    })();
    return Tracker = (function() {
      function Tracker(_source) {
        this._source = _source;
        this._addTypes = __bind(this._addTypes, this);
        this._mixin = {};
      }

      Tracker.prototype.track = function(name, data) {
        if (data == null) {
          data = {};
        }
        queue.push(this._addTypes({
          source: this._source,
          event: name,
          data: _.extend({}, this._mixin, data),
          ts_dt: Math.round((new Date).getTime() / 1000)
        }));
        return throttledSave();
      };

      Tracker.prototype.createTimer = function(name, data) {
        var onStopped,
          _this = this;
        if (data == null) {
          data = {};
        }
        onStopped = function(_arg) {
          var data, duration, name;
          name = _arg.name, data = _arg.data, duration = _arg.duration;
          return _this.track(name, _.extend(data, {
            duration: duration
          }));
        };
        return new Timer({
          name: name,
          data: data,
          done: onStopped
        });
      };

      Tracker.prototype.setMixin = function(_mixin) {
        this._mixin = _mixin;
      };

      Tracker.prototype.timeXHR = function(jqXHR, name, data) {
        var timer;
        timer = this.createTimer(name, data);
        return jqXHR.always(function(data, status) {
          return timer.stop({
            status: status
          });
        });
      };

      Tracker.prototype._addTypes = function(obj) {
        var pairs,
          _this = this;
        if (_.isArray(obj)) {
          return _.map(obj, this._addTypes);
        }
        if (_.isObject(obj)) {
          pairs = _.map(_.pairs(obj), function(_arg) {
            var key, newKey, newVal, val, _ref1;
            key = _arg[0], val = _arg[1];
            newKey = key + ((_ref1 = key.slice(-3)) === '_i' || _ref1 === '_f' || _ref1 === '_dt' || _ref1 === '_tsd' ? '' : _.isNumber(val) ? val % 1 === 0 ? '_i' : '_f' : _.isString(val) ? '_tsd' : '');
            newVal = _.isObject(val) ? _this._addTypes(val) : val;
            return [newKey, newVal];
          });
          return _.object(pairs);
        } else {
          return obj;
        }
      };

      return Tracker;

    })();
  });

}).call(this);
