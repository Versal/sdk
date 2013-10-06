(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.lodash', 'cdn.jquery'], function(_, $) {
    var VsSticky;
    return VsSticky = (function() {

      function VsSticky(els, offset, interval) {
        this.els = els;
        this.offset = offset != null ? offset : 0;
        this.interval = interval != null ? interval : 10;
        this.scroll = __bind(this.scroll, this);

        this.updateEls(this.els);
        $("<style>.vs-sticky-stuck{top:" + this.offset + "px;}</style>").appendTo('head');
        this.topEl = this.els.get(0);
        this.scroll();
      }

      VsSticky.prototype.setEls = function(els) {
        this.els = els;
        return this.topEl = this.els.get(0);
      };

      VsSticky.prototype.updateEls = function() {
        this.els.addClass('vs-sticky');
        this.teardown();
        this.els.each(function() {
          return $(this).data({
            start: $(this).offset().top,
            height: $(this).outerHeight()
          });
        });
        return this.scroll();
      };

      VsSticky.prototype.listen = function() {
        var throttledScroll,
          _this = this;
        this.scroll();
        throttledScroll = _.throttle(this.scroll, this.interval);
        return $(window).on('scroll', function() {
          return throttledScroll();
        });
      };

      VsSticky.prototype.stopListening = function() {
        return $(window).off('scroll');
      };

      VsSticky.prototype.teardown = function() {
        this.els.removeClass('vs-sticky-stuck');
        return this.els.removeAttr('style');
      };

      VsSticky.prototype.scroll = function() {
        var cutoff, distanceToNext, height, i, nextEl, start, wrapper;
        cutoff = $(window).scrollTop() + this.offset;
        this.teardown();
        height = $(this.topEl).data('height');
        start = $(this.topEl).data('start');
        if (start > cutoff) {
          if (this.topEl !== this.els.get(0)) {
            i = 1;
            while ($(this.els[i]).data("start") < cutoff) {
              i++;
            }
            this.topEl = this.els[i - 1];
            this.scroll();
            return;
          }
        }
        if ($(this.topEl).parent().hasClass('wrapper')) {
          $(this.topEl).unwrap();
        }
        if (start <= cutoff) {
          wrapper = $('<div>').addClass('wrapper');
          wrapper.height(height);
          wrapper.css({
            'margin-bottom': $(this.topEl).css('margin-bottom')
          });
          $(this.topEl).wrap(wrapper);
          $(this.topEl).addClass('vs-sticky-stuck');
          nextEl = this.els.get(1 + this.els.index(this.topEl));
          if (!nextEl) {
            return;
          }
          distanceToNext = $(nextEl).data('start') - cutoff;
          if (distanceToNext <= height) {
            $(this.topEl).css('top', (this.offset + distanceToNext - height) + 'px');
            if (distanceToNext < 1) {
              return this.topEl = nextEl;
            }
          }
        }
      };

      return VsSticky;

    })();
  });

}).call(this);
