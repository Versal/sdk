(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.jquery', 'cdn.underscore'], function($, _) {
    var EdgeScroll;
    return EdgeScroll = (function() {
      var defaults;

      defaults = {
        top: 40,
        bottom: 40,
        speed: 30,
        threshold: 400,
        duration: 100,
        zIndex: 6000,
        container: $('body')
      };

      function EdgeScroll(options) {
        var $bottom, $top, styles;
        this.options = options;
        this._step = __bind(this._step, this);
        this._startScrolling = __bind(this._startScrolling, this);
        this._onMouseLeave = __bind(this._onMouseLeave, this);
        this._onMouseEnter = __bind(this._onMouseEnter, this);
        _.defaults(this.options, defaults);
        styles = {
          position: 'fixed',
          left: 0,
          width: '100%',
          opacity: 0,
          display: 'none',
          'z-index': this.options.zIndex
        };
        $top = $('<div>').css(_.extend({}, styles, {
          top: 0,
          height: this.options.top
        }));
        $bottom = $('<div>').css(_.extend({}, styles, {
          bottom: 0,
          height: this.options.bottom
        }));
        this.$zones = $([$top[0], $bottom[0]]);
        this.options.container.append(this.$zones);
        $top.on({
          mouseenter: _.partial(this._onMouseEnter, -1),
          mouseleave: this._onMouseLeave
        });
        $bottom.on({
          mouseenter: _.partial(this._onMouseEnter, 1),
          mouseleave: this._onMouseLeave
        });
      }

      EdgeScroll.prototype._onMouseEnter = function(_direction) {
        this._direction = _direction;
        if (this._scrollingInterval) {
          this._teardown();
        }
        this._mouseover = true;
        return setTimeout(this._startScrolling, this.options.threshold);
      };

      EdgeScroll.prototype._onMouseLeave = function() {
        this._mouseover = false;
        return this._teardown();
      };

      EdgeScroll.prototype._startScrolling = function() {
        if (!this._mouseover) {
          return;
        }
        this._position = this.options.container.scrollTop();
        if (this._scrollingInterval) {
          this._teardown();
        }
        return this._scrollingInterval = setInterval(this._step, this.options.duration);
      };

      EdgeScroll.prototype._step = function() {
        this._position += this._direction * this.options.speed;
        return this.options.container.animate({
          scrollTop: this._position
        }, this.options.duration, 'linear');
      };

      EdgeScroll.prototype._teardown = function() {
        clearInterval(this._scrollingInterval);
        return this._scrollingInterval = null;
      };

      EdgeScroll.prototype.enable = function() {
        return this.$zones.show();
      };

      EdgeScroll.prototype.disable = function() {
        this._teardown();
        return this.$zones.hide();
      };

      EdgeScroll.prototype.destroy = function() {
        this._teardown();
        return this.$zones.remove();
      };

      return EdgeScroll;

    })();
  });

}).call(this);
