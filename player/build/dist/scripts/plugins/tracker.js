(function() {

  define(['app/mediator'], function(mediator) {
    var mixin, options;
    options = {};
    return mixin = function(category) {
      return {
        _activeTimers: {},
        trackerSetup: function(opts) {
          return options = opts;
        },
        track: function(action, data) {
          if (data == null) {
            data = {};
          }
          return mediator.trigger('metric:record', category, action, _.extend({}, options, data));
        },
        startTimer: function(name) {
          var _this = this;
          this._activeTimers[name] = (new Date).getTime();
          return {
            end: function() {
              return _this.endTimer(name);
            }
          };
        },
        endTimer: function(name, data) {
          var currentTime, info, timer;
          if (data == null) {
            data = {};
          }
          if (!(timer = this._activeTimers[name])) {
            return false;
          }
          currentTime = (new Date).getTime();
          info = {
            start: timer,
            end: currentTime,
            length: currentTime - timer
          };
          mediator.trigger('metric:record', category, name, _.extend({}, options, data, info), 'timer');
          return delete this._activeTimers[name];
        }
      };
    };
  });

}).call(this);
