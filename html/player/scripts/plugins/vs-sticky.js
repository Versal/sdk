(function() {
  define(['cdn.underscore', 'cdn.jquery'], function(_, $) {
    var StickyHeaders, VENDOR_PREFIXES;
    VENDOR_PREFIXES = ['', '-webkit-', '-moz-', '-ms-', '-o-'];
    return StickyHeaders = (function() {
      StickyHeaders.prototype.selector = '.js-sticky-header';

      function StickyHeaders(el) {
        this.el = el;
        this.refresh = _.throttle(this.refresh.bind(this), 10);
        this._current = null;
        this._stickyContainer = $('<div class="vs-sticky-container" />');
        this.enable();
      }

      StickyHeaders.prototype.enable = function() {
        return $(this.el).on('scroll', this.refresh);
      };

      StickyHeaders.prototype.disable = function() {
        return $(this.el).off('scroll', this.refresh);
      };

      StickyHeaders.prototype.refresh = function() {
        var candidates, current, cutoff, next, _ref;
        cutoff = this.el.getBoundingClientRect().top;
        candidates = this.el.querySelectorAll(this.selector);
        if (!candidates.length) {
          return this.setStickyHeader(null);
        }
        _ref = _.reduce(candidates, _.partial(this.findCurrent, cutoff), null), current = _ref.current, next = _ref.next;
        if (this._sticky !== current) {
          this.setStickyHeader(current);
        }
        return this.adjustCurrent(cutoff, current, next);
      };

      StickyHeaders.prototype.findCurrent = function(cutoff, memo, cur) {
        if (memo == null) {
          memo = {
            current: null,
            next: null
          };
        }
        if (!memo.next) {
          if (cur.getBoundingClientRect().top <= cutoff) {
            memo.current = cur;
          }
          if (memo.current !== cur) {
            memo.next = cur;
          }
        }
        return memo;
      };

      StickyHeaders.prototype.setStickyHeader = function(current) {
        this._sticky = current;
        if (!current) {
          return this._stickyContainer.detach();
        }
        return this._stickyContainer.text(current.textContent).appendTo(this.el);
      };

      StickyHeaders.prototype.adjustCurrent = function(cutoff, current, next) {
        var offset, remainingSpace, transform;
        if (!current) {
          return;
        }
        remainingSpace = ((next != null ? next.getBoundingClientRect().top : void 0) || this.el.getBoundingClientRect().bottom) - cutoff;
        offset = remainingSpace - current.getBoundingClientRect().height;
        transform = offset <= 0 ? "translateY(" + offset + "px)" : 'none';
        return $(this._stickyContainer).css(_.object(_.map(VENDOR_PREFIXES, function(pref) {
          return ["" + pref + "transform", transform];
        })));
      };

      return StickyHeaders;

    })();
  });

}).call(this);
