(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.underscore', 'cdn.jquery'], function(_, $) {
    var VsSticky;
    return VsSticky = (function() {
      VsSticky.prototype.STUCK_Z_INDEX = 98;

      function VsSticky($container, selector) {
        this.$container = $container;
        this.selector = selector != null ? selector : '.js-sticky-header';
        this._watchContainer = __bind(this._watchContainer, this);
        this._scroll = __bind(this._scroll, this);
        this.scanContainer();
        this._throttledScroll = _.throttle(this._scroll, 10);
        $(window).on('scroll', this._throttledScroll);
        this._watchInterval = setInterval(this._watchContainer, 730);
      }

      VsSticky.prototype.destroy = function() {
        this._changeCurrentSection(null);
        $(window).off('scroll', this._throttledScroll);
        return clearInterval(this._watchInterval);
      };

      VsSticky.prototype.scanContainer = function() {
        var $header, $headers, i, prevSection, _i, _ref, _ref1;
        this._containerTop = this.$container.offset().top;
        this._containerHeight = this.$container.height();
        this._changeCurrentSection(null);
        this._sections = [];
        $headers = this.$container.find(this.selector);
        for (i = _i = 0, _ref = $headers.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          $header = $($headers[i]);
          $header.css({
            position: 'relative'
          });
          this._sections.push({
            top: $header.offset().top,
            headerHeight: $header.outerHeight(),
            $header: $header
          });
          if (i > 0) {
            prevSection = this._sections[i - 1];
            prevSection.bottom = $header.offset().top;
          }
        }
        if ((_ref1 = _.last(this._sections)) != null) {
          _ref1.bottom = this.$container.height();
        }
        return this._scroll();
      };

      VsSticky.prototype._inCurrentSection = function(y) {
        if (this._currentSection == null) {
          return false;
        }
        return (this._currentSection.top <= y && y < this._currentSection.bottom);
      };

      VsSticky.prototype._findSectionByCutoff = function(y) {
        return _.find(this._sections, function(section) {
          return (section.top <= y && y < section.bottom);
        });
      };

      VsSticky.prototype._setHeaderOffset = function(section, y) {
        var headerOffset;
        if (this._currentSection == null) {
          return;
        }
        headerOffset = y + section.headerHeight - section.bottom;
        if (headerOffset > 0) {
          return section.$header.css('top', this._containerTop - headerOffset);
        } else {
          return section.$header.css('top', this._containerTop);
        }
      };

      VsSticky.prototype._scroll = function() {
        var cutoff;
        cutoff = $(window).scrollTop() + this._containerTop;
        if (!this._inCurrentSection(cutoff)) {
          this._changeCurrentSection(this._findSectionByCutoff(cutoff));
        }
        return this._setHeaderOffset(this._currentSection, cutoff);
      };

      VsSticky.prototype._changeCurrentSection = function(section) {
        if (this._currentSection != null) {
          this._unwrap(this._currentSection);
        }
        if (section != null) {
          this._wrap(section);
        }
        return this._currentSection = section;
      };

      VsSticky.prototype._wrap = function(section) {
        var placeholder;
        section.$header.css({
          left: section.$header.offset().left,
          top: this._containerTop
        });
        placeholder = $('<div/>').height(section.headerHeight);
        return section.$header.wrap(placeholder).css({
          'z-index': this.STUCK_Z_INDEX,
          position: 'fixed',
          width: '100%'
        });
      };

      VsSticky.prototype._unwrap = function(section) {
        return section.$header.removeAttr('style').unwrap();
      };

      VsSticky.prototype._watchContainer = function() {
        if (this._containerTop !== this.$container.offset().top || this._containerHeight !== this.$container.height()) {
          return this.scanContainer();
        }
      };

      return VsSticky;

    })();
  });

}).call(this);
