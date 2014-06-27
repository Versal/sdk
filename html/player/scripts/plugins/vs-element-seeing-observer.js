(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.jquery', 'cdn.underscore', 'app/mediator', 'plugins/custom_event_polyfill'], function($, _, mediator) {
    var ElementSeeingObserver;
    return ElementSeeingObserver = (function() {
      ElementSeeingObserver.prototype._viewportBottomOffset = 28;

      ElementSeeingObserver.prototype._delay = 150;

      function ElementSeeingObserver(el) {
        this.el = el;
        this._viewportChanged = __bind(this._viewportChanged, this);
        if (!this.el) {
          return;
        }
        this._debouncedViewportChanged = _.debounce(this._viewportChanged, this._delay);
        mediator.on('player:viewportChanged', this._debouncedViewportChanged);
      }

      ElementSeeingObserver.prototype.destroy = function() {
        return mediator.off('player:viewportChanged', this._debouncedViewportChanged);
      };

      ElementSeeingObserver.prototype._viewportChanged = function() {
        var gadgetElements,
          _this = this;
        gadgetElements = this.el.querySelectorAll('.gadget');
        return _.each(gadgetElements, function(gadget) {
          var inViewport;
          if (gadget.hasAttribute('element-was-seen')) {
            return;
          }
          inViewport = _this._isInViewport(gadget, innerHeight);
          if (inViewport) {
            gadget.dispatchEvent(new CustomEvent('elementWasSeen'));
            return gadget.setAttribute('element-was-seen', 1);
          }
        });
      };

      ElementSeeingObserver.prototype._isInViewport = function(el, end) {
        var fuzzyEnd, rect;
        fuzzyEnd = end + 10;
        rect = el.getBoundingClientRect();
        return rect.bottom < fuzzyEnd;
      };

      return ElementSeeingObserver;

    })();
  });

}).call(this);
