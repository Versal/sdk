// # clayer
// **clayer** is a lightweight library for highly interactive websites.
// It provides an abstraction for mouse and (multi-)touch events, and high-level widgets.
// Clayer is based on the internal library of <worrydream.com>, Bret Victor's website, called *BVLayer* or *LayerScript*.
// You can pick and choose what you like from this library and adapt it to your own needs.
// We believe it is more useful to have a simple, readable library that you can fully understand and modify, than having a large and configurable library.

/*jshint jquery:true */
(function () {
  "use strict";
  define([], function(){
    // ## Helper functions

    // Clayer uses the `clayer` global object.
    var clayer = {};
    window.clayer = clayer;

    // Modify `clayer.texts` to internationalize strings.
    clayer.texts = {
      drag: 'drag'
    };

    // `clayer.makeCall()` is used for only calling callbacks if they exist.
    clayer.makeCall = function(obj, func, args) {
      if (obj[func]) {
        return obj[func].apply(obj, args);
      }
    };

    // `clayer.setCss3()` can be used to apply proprietary CSS extensions.
    // The prefixes of the major browsers are added before the name of the attribute.
    // If `addBrowserToValue` is true, it is also added before the value, which is useful for some attributes such as transitions.
    clayer.setCss3 = function($element, name, value, addBrowserToValue) {
      addBrowserToValue = addBrowserToValue || false;
      var browsers = ['', '-ms-', '-moz-', '-webkit-', '-o-'];
      for (var i=0; i<browsers.length; i++) {
        var cssName = browsers[i] + name;
        var cssValue = (addBrowserToValue ? browsers[i] : '') + value;
        $element.css(cssName, cssValue);
      }
    };

    // `clayer.isTouch` is true or false depending on whether the browser supports touch events.
    clayer.isTouch = ('ontouchstart' in document.documentElement);

    // When `clayer.initBody()` is called, the body element is given a `clayer-body-touch` or `clayer-body-mouse` class, depending on `clayer.isTouch`.
    clayer.initBody = function() {
      if (clayer.isTouch) {
        $('body').addClass('clayer-body-touch');
      } else {
        $('body').addClass('clayer-body-mouse');
      }
    };

    // ## Touchable
    // `clayer.Touchable` provides an abstraction over touch and mouse events.
    // We make a distinction between hover and touch/click events. First we look at the latter.
    //
    clayer.Touchable = function() { return this.init.apply(this, arguments); };
    clayer.Touchable.prototype = {
      init: function($element, callbacks) {
        this.$element = $element;
        this.$document = $($element[0].ownerDocument);
        this.callbacks = callbacks;

        this.mouseDown = $.proxy(this.mouseDown, this);
        this.mouseMove = $.proxy(this.mouseMove, this);
        this.mouseUp = $.proxy(this.mouseUp, this);
        this.touchStart = $.proxy(this.touchStart, this);
        this.touchMove = $.proxy(this.touchMove, this);
        this.touchEnd = $.proxy(this.touchEnd, this);
        this.hoverMove = $.proxy(this.hoverMove, this);
        this.hoverLeave = $.proxy(this.hoverLeave, this);

        this.documentEvents = {
          mousemove: this.mouseMove,
          mouseup: this.mouseUp,
          touchmove: this.touchMove,
          touchend: this.touchEnd,
          touchcancel: this.touchEnd
        };

        this.setTouchable(false);
        this.setHoverable(false);
      },

      remove: function() {
        this.setTouchable(false);
        this.setHoverable(false);
      },

      setTouchable: function(isTouchable) {
        if (this.isTouchable === isTouchable) return;
        this.isTouchable = isTouchable;
        this.touchEvent = null;

        if (isTouchable) {
          this.$element.on({
            mousedown: this.mouseDown,
            touchstart: this.touchStart
          });
        }
        else {
          this.$element.off('mousedown touchstart');
          this.$document.off(this.documentEvents);
          // CSS3 "pointer-events: none" here? (not supported by IE)
        }
      },

      setHoverable: function(isHoverable) {
        if (this.isHoverable === isHoverable) return;
        this.isHoverable = isHoverable;
        this.hoverEvent = null;

        if (isHoverable) {
          this.$element.on({
            mousemove: this.hoverMove,
            mouseleave: this.hoverLeave
          });
        }
        else {
          this.$element.off({
            mousemove: this.hoverMove,
            mouseleave: this.hoverLeave
          });
          // CSS3 "pointer-events: none" here? (not supported by IE)
        }
      },

      mouseDown: function(event) {
        if (this.isTouchable) {
          this.$document.on({
            mousemove: this.mouseMove,
            mouseup: this.mouseUp
          });

          this.touchEvent = new clayer.PositionEvent(this.$element, event, event.timeStamp, true);
          clayer.makeCall(this.callbacks, 'touchDown', [this.touchEvent]);
        }
        return false;
      },

      mouseMove: function(event) {
        if (this.isTouchable && this.touchEvent) {
          this.touchEvent.move(event, event.timeStamp);
          clayer.makeCall(this.callbacks, 'touchMove', [this.touchEvent]);
        }
        return false;
      },

      mouseUp: function(event) {
        if (this.isTouchable && this.touchEvent) {
          this.touchEvent.up(event, event.timeStamp);
          clayer.makeCall(this.callbacks, 'touchUp', [this.touchEvent]);
          this.touchEvent = null;
        }
        this.$document.off(this.documentEvents);
        return false;
      },

      touchStart: function(event) {
        this.$element.off({
          'mousedown': this.mouseDown,
          'mousemove': this.hoverMove,
          'mouseleave': this.hoverLeave
        }); // we're on a touch device (safer than checking using clayer.isTouch)

        if (!this.isTouchable || this.touchEvent || event.originalEvent.targetTouches.length > 1) {
          this.touchEnd(event);
        } else {
          this.$document.on({
            touchmove: this.touchMove,
            touchend: this.touchEnd,
            touchcancel: this.touchEnd
          });

          this.touchEvent = new clayer.PositionEvent(this.$element, event.originalEvent.targetTouches[0], event.timeStamp, false);
          clayer.makeCall(this.callbacks, 'touchDown', [this.touchEvent]);
        }
        return false;
      },

      touchMove: function(event) {
        if (this.isTouchable && this.touchEvent) {
          var touchEvent = this.findTouchEvent(event.originalEvent.touches);
          if (touchEvent === null) {
            this.touchEnd(event);
          } else {
            this.touchEvent.move(touchEvent, event.timeStamp);
            clayer.makeCall(this.callbacks, 'touchMove', [this.touchEvent]);
          }
        }
        return false;
      },

      touchEnd: function(event) {
        if (this.isTouchable && this.touchEvent) {
          this.touchEvent.up(this.findTouchEvent(event.originalEvent.touches), event.timeStamp);
          clayer.makeCall(this.callbacks, 'touchUp', [this.touchEvent]);
          this.touchEvent = null;
        }
        this.$document.off(this.documentEvents);
        return false;
      },

      hoverMove: function(event) {
        if (this.touchEvent) {
          this.mouseMove(event);
        } else if (this.isHoverable) {
          if (!this.hoverEvent) {
            this.hoverEvent = new clayer.PositionEvent(this.$element, event, true);
          } else {
            this.hoverEvent.move(event, event.timeStamp);
          }
          clayer.makeCall(this.callbacks, 'hoverMove', [this.hoverEvent]);
        }
        return false;
      },

      hoverLeave: function(event) {
        if (this.isHoverable && this.hoverEvent) {
          this.hoverEvent.move(event);
          clayer.makeCall(this.callbacks, 'hoverLeave', [this.hoverEvent]);
          this.hoverEvent = null;
        }
        return false;
      },

      findTouchEvent: function(touches) {
        for (var i=0; i<touches.length; i++) {
          if (touches[i].identifier === this.touchEvent.event.identifier) {
            return touches[i];
          }
        }
        return null;
      }
    };

    clayer.PositionEvent = function() { return this.init.apply(this, arguments); };
    clayer.PositionEvent.prototype = {
      init: function($element, event, timestamp, mouse) {
        this.$element = $element;
        this.globalPoint = { x: event.pageX, y: event.pageY };
        this.translation = { x: 0, y: 0 };
        this.deltaTranslation = { x: 0, y: 0 };
        this.localPoint = { x: 0, y: 0 };
        this.updateLocalPoint();

        this.event = event;
        this.startTimestamp = this.timestamp = timestamp;
        this.hasMoved = false;
        this.wasTap = false;
        this.mouse = mouse;
      },

      getTimeSinceGoingDown: function () {
        return this.timestamp - this.startTimestamp;
      },

      resetDeltaTranslation: function() {
        this.deltaTranslation.x = 0;
        this.deltaTranslation.y = 0;
      },

      inElement: function() {
        return this.localPoint.x >= 0 && this.localPoint.x <= this.$element.outerWidth() &&
          this.localPoint.y >= 0 && this.localPoint.y <= this.$element.outerHeight();
      },

      move: function(event, timestamp) {
        this.event = event;
        this.timestamp = timestamp;
        this.updatePositions();
      },

      up: function(event, timestamp) {
        this.event = event || this.event;
        this.timestamp = timestamp;
        this.wasTap = !this.hasMoved && (this.getTimeSinceGoingDown() < 300);
      },

      updatePositions: function() {
        var dx = this.event.pageX - this.globalPoint.x;
        var dy = this.event.pageY - this.globalPoint.y;
        this.translation.x += dx;
        this.translation.y += dy;
        this.deltaTranslation.x += dx;
        this.deltaTranslation.y += dy;
        this.globalPoint.x = this.event.pageX;
        this.globalPoint.y = this.event.pageY;
        this.updateLocalPoint();

        if (this.translation.x*this.translation.x + this.translation.y*this.translation.y > 200) this.hasMoved = true;
      },

      updateLocalPoint: function() {
        var offset = this.$element.offset();
        this.localPoint.x = this.globalPoint.x - offset.left;
        this.localPoint.y = this.globalPoint.y - offset.top;
      }
    };

    clayer.Scrubbable = function() { return this.init.apply(this, arguments); };
    clayer.Scrubbable.prototype = {
      init: function($element, callbacks, options) {
        this.$element = $element;
        this.callbacks = callbacks;
        this.options = options || {};
        this.touchable = new clayer.Touchable($element, this);
        this.setScrubbable(true);
      },

      remove: function() {
        this.touchable.remove();
      },

      setScrubbable: function(value) {
        this.touchable.setTouchable(value);

        if (this.options.disableHover) {
          this.touchable.setHoverable(false);
        } else {
          this.touchable.setHoverable(value);
        }
      },

      hoverMove: function(event) {
        clayer.makeCall(this.callbacks, 'scrubMove', [event.localPoint.x, event.localPoint.y, false]);
      },

      hoverLeave: function(event) {
        clayer.makeCall(this.callbacks, 'scrubLeave', []);
      },

      touchDown: function(event) {
        this.touchMove(event);
      },

      touchMove: function(event) {
        clayer.makeCall(this.callbacks, 'scrubMove', [event.localPoint.x, event.localPoint.y, true]);
      },

      touchUp: function(event) {
        if (!event.mouse || !event.inElement()) {
          clayer.makeCall(this.callbacks, 'scrubLeave', []);
        } else {
          this.hoverMove(event);
        }
        if (event.wasTap) {
          clayer.makeCall(this.callbacks, 'scrubTap', [event.localPoint.x, event.localPoint.y]);
        }
      }
    };

    clayer.Slider = function() { return this.init.apply(this, arguments); };
    clayer.Slider.prototype = {
      init: function($element, callbacks, valueWidth, options) {
        this.$element = $element;
        this.$element.addClass('clayer-slider');
        this.callbacks = callbacks;

        this.valueWidth = valueWidth || 1;
        this.markerValue = 0;
        this.knobValue = 0;

        this.$container = $('<div class="clayer-slider-container"></div>');
        this.$element.append(this.$container);

        this.$bar = $('<div class="clayer-slider-bar"></div>');
        this.$container.append(this.$bar);

        this.$segmentContainer = $('<div class="clayer-slider-segment-container"></div>');
        this.$bar.append(this.$segmentContainer);

        this.$marker = $('<div class="clayer-slider-marker"></div>');
        this.markerWidth = Math.min(this.valueWidth, 10);
        this.$marker.width(this.markerWidth);
        this.$bar.append(this.$marker);

        this.$knob = $('<div class="clayer-slider-knob"></div>');
        this.$container.append(this.$knob);

        this.scrubbable = new clayer.Scrubbable(this.$element, this, options);

        this.bounceTimer = null;

        this.renderKnob();
        this.renderMarker();
      },

      remove: function() {
        this.scrubbable.remove();
        this.$segmentContainer.remove();
        this.$marker.remove();
        this.$knob.remove();
        this.$bar.remove();
        this.$container.remove();
      },

      setSegments: function(ranges) {
        this.$segmentContainer.html('');
        for (var i=0; i<ranges.length; i++) {
          var range = ranges[i];
          var $segment = $('<div class="clayer-slider-segment"></div>');
          this.$segmentContainer.append($segment);

          $segment.css('left', range.start*this.valueWidth);
          $segment.width((range.end - range.start + 1)*this.valueWidth);
          $segment.css('background-color', range.color);
        }
      },

      setValue: function(value) {
        this.markerValue = this.knobValue = value;
        this.renderKnob();
        this.renderMarker();
      },

      setKnobValue: function(value) {
        this.knobValue = value;
        this.renderKnob();
      },

      changed: function(down) {
        clayer.makeCall(this.callbacks, 'sliderChanged', [this.knobValue, down]);
      },

      updateKnob: function(x) {
        x = Math.max(0, Math.min(this.$element.width()-1, x));
        this.updateKnobValue(Math.floor(x/this.valueWidth));
      },

      updateKnobValue: function(knobValue) {
        if (this.knobValue !== knobValue) {
          this.knobValue = knobValue;
          this.renderKnob();
          this.changed(false);
        }
      },

      updateMarker: function(x) {
        x = Math.max(0, Math.min(this.$element.width()-1, x));
        var markerValue = Math.floor(x/this.valueWidth);
        if (this.markerValue !== markerValue) {
          this.knobValue = this.markerValue = markerValue;
          this.renderKnob();
          this.renderMarker();
          this.changed(true);
        }
      },

      renderKnob: function() {
        this.$knob.css('left', (this.knobValue+0.5)*this.valueWidth);
      },

      renderMarker: function() {
        this.$marker.css('left', (this.markerValue+0.5)*this.valueWidth - this.markerWidth/2);
      },

      scrubMove: function(x, y, down) {
        this.$knob.addClass('clayer-active');
        if (down) {
          this.$knob.addClass('clayer-pressed');
          this.updateMarker(x);
        } else {
          this.$knob.removeClass('clayer-pressed');
          this.updateKnob(x);
        }
      },

      scrubLeave: function() {
        this.$knob.removeClass('clayer-active clayer-pressed');
        this.updateKnobValue(this.markerValue);
        clayer.makeCall(this.callbacks, 'sliderLeave');
      },

      scrubTap: function() {
        this.$knob.removeClass('clayer-slider-knob-jump');
        setTimeout($.proxy(this.startJump, this), 0);
      },

      startJump: function() {
        this.$knob.addClass('clayer-slider-knob-jump');
      }
    };

    clayer.Draggable = function() { return this.init.apply(this, arguments); };
    clayer.Draggable.prototype = {
      init: function($element, callbacks, $parent) {
        this.$element = $element;
        this.callbacks = callbacks;
        this.$parent = $parent;
        this.touchable = new clayer.Touchable($element, this);
        this.setDraggable(true);
      },

      remove: function() {
        this.touchable.remove();
      },

      setDraggable: function(value) {
        this.touchable.setTouchable(value);
        this.touchable.setHoverable(false);
      },

      touchDown: function(event) {
        this.offsetX = event.localPoint.x + parseInt(this.$element.css('margin-left'), 10);
        this.offsetY = event.localPoint.y + parseInt(this.$element.css('margin-top'), 10);
        clayer.makeCall(this.callbacks, 'dragStart', [this.offsetX, this.offsetY]);
      },

      touchMove: function(event) {
        var x = event.globalPoint.x-this.offsetX, y = event.globalPoint.y-this.offsetY;

        if (this.$parent !== undefined) {
          var parentOffset = this.$parent.offset();
          x = Math.max(0, Math.min(this.$parent.outerWidth(), x-parentOffset.left));
          y = Math.max(0, Math.min(this.$parent.outerHeight(), y-parentOffset.top));
          this.$element.css('left', x);
          this.$element.css('top', y);
          clayer.makeCall(this.callbacks, 'dragMove', [x, y, event.globalPoint.x, event.globalPoint.y]);
        } else {
          clayer.makeCall(this.callbacks, 'dragMove', [x, y, event.globalPoint.x, event.globalPoint.y]);
        }
      },

      touchUp: function(event) {
        clayer.makeCall(this.callbacks, 'dragEnd');
        if (event.wasTap) {
          clayer.makeCall(this.callbacks, 'dragTap', [event.localPoint.x, event.localPoint.y]);
        }
      }
    };

    clayer.DragKnob = function() { return this.init.apply(this, arguments); };
    clayer.DragKnob.prototype = {
      init: function($element, callbacks, $parent) {
        this.$element = $element;
        this.$element.addClass('clayer-dragknob');
        this.$element.append('<div class="clayer-dragknob-label">' + clayer.texts.drag + '</div>');

        this.$parent = $parent;
        if (this.$parent !== undefined) {
          this.$parent.addClass('clayer-dragknob-parent');
        }

        this.callbacks = callbacks;
        this.draggable = new clayer.Draggable($element, this, $parent);
      },

      remove: function() {
        this.draggable.remove();
        this.$element.removeClass('clayer-dragknob');
        if (this.$parent !== undefined) {
          this.$parent.addClass('clayer-dragknob-parent');
        }
      },

      dragStart: function() {
        this.$element.addClass('clayer-pressed');
        this.$element.removeClass('clayer-dragknob-show-label');
        clayer.makeCall(this.callbacks, 'dragStart');
      },

      dragMove: function(x, y) {
        clayer.makeCall(this.callbacks, 'dragMove', arguments);
      },

      dragEnd: function() {
        this.$element.removeClass('clayer-pressed');
        clayer.makeCall(this.callbacks, 'dragEnd');
      },

      dragTap: function() {
        this.$element.addClass('clayer-dragknob-show-label');
        clayer.makeCall(this.callbacks, 'dragTap');
      }
    };

    return clayer;
  });
})();
