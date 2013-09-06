(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.jquery', 'libs/backbone-forms', 'clayer'], function($, Form, clayer) {
    return Form.editors.Range = (function(_super) {

      __extends(Range, _super);

      function Range() {
        return Range.__super__.constructor.apply(this, arguments);
      }

      Range.prototype.width = 210;

      Range.prototype.initialize = function(options) {
        Range.__super__.initialize.call(this, options);
        this.min = this.schema.min || 0;
        this.max = this.schema.max || 100;
        return this.step = this.schema.step || 1;
      };

      Range.prototype.render = function() {
        var range;
        this.$el.width(this.width);
        range = (this.max - this.min) / this.step + 1;
        this.slider = new clayer.Slider(this.$el, this, this.width / range, {
          disableHover: true
        });
        this.$knob = $('<div class="clayer-slider-knob-value"></div>');
        this.$('.clayer-slider-knob').append(this.$knob);
        this.setValue(this.value || 0);
        return this;
      };

      Range.prototype.sliderChanged = function(value) {
        var decs, val;
        decs = this._decimalPlaces();
        val = Number((value * this.step + this.min).toFixed(decs));
        this.sliderValue = this._clamp(val);
        this.updateKnob();
        return this.trigger('change', this);
      };

      Range.prototype._decimalPlaces = function() {
        var decimals;
        decimals = ('' + this.step).split('.')[1] || '';
        return decimals.length;
      };

      Range.prototype._clamp = function(val) {
        return Math.min(this.max, Math.max(this.min, val));
      };

      Range.prototype.getValue = function() {
        return this.sliderValue;
      };

      Range.prototype.setValue = function(value) {
        this.sliderValue = value;
        this.slider.setValue((value - this.min) / this.step);
        return this.updateKnob();
      };

      Range.prototype.updateKnob = function() {
        return this.$knob.text(this.sliderValue);
      };

      Range.prototype.focus = function() {
        if (this.hasFocus) {

        }
      };

      Range.prototype.blur = function() {
        if (!this.hasFocus) {

        }
      };

      return Range;

    })(Form.editors.Base);
  });

}).call(this);
