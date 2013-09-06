(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['libs/backbone-forms', 'modernizr', 'libs/spectrum'], function(Form) {
    return Form.editors.Color = (function(_super) {

      __extends(Color, _super);

      function Color() {
        return Color.__super__.constructor.apply(this, arguments);
      }

      Color.prototype.events = {
        'change  input[type=color]': 'onColorChange',
        'change  input[type=text]': 'onTextChange',
        'keyup   input[type=text]': 'onTextChange',
        'keydown input[type=text]': 'onTextChange',
        focus: 'onFocus',
        blur: 'onBlur'
      };

      Color.prototype.onColorChange = function() {
        return this.setPickerColor(this.$colorInput().val());
      };

      Color.prototype.onTextChange = function() {
        this.color = this.$textInput().val();
        this.$colorInput().val(this.color);
        return this.trigger('change', this);
      };

      Color.prototype.onFocus = function() {
        return this.trigger('focus', this);
      };

      Color.prototype.onBlur = function() {
        return this.trigger('blur', this);
      };

      Color.prototype.render = function() {
        var _this = this;
        this.$el.html(this.$colorInput());
        if (!Modernizr.inputtypes.color) {
          this.$colorInput().spectrum({
            color: this.value,
            move: function(color) {
              return _this.setPickerColor("#" + color.toHex());
            }
          });
        }
        this.$el.append(this.$textInput());
        this.setValue(this.value);
        return this;
      };

      Color.prototype.setPickerColor = function(color) {
        this.color = color;
        this.$textInput().val(this.color);
        return this.trigger('change', this);
      };

      Color.prototype.$colorInput = function() {
        var _ref;
        return (_ref = this._colorInput) != null ? _ref : this._colorInput = $('<input class="input-color-color" type="color"></input>');
      };

      Color.prototype.$textInput = function() {
        var _ref;
        return (_ref = this._textInput) != null ? _ref : this._textInput = $('<input class="input-color-text" type="text"></input>');
      };

      Color.prototype.getValue = function() {
        return this.color;
      };

      Color.prototype.setValue = function(color) {
        this.color = color;
        this.$colorInput().val(this.color);
        return this.$textInput().val(this.color);
      };

      Color.prototype.focus = function() {
        if (!this.hasFocus) {
          return this.$colorInput().focus();
        }
      };

      Color.prototype.blur = function() {
        if (this.hasFocus) {
          return this.$colorInput().blur();
        }
      };

      return Color;

    })(Form.editors.Base);
  });

}).call(this);
