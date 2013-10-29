(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.underscore', 'libs/backbone-forms', 'tags'], function(_, Form, tags) {
    return Form.editors.Tags = (function(_super) {

      __extends(Tags, _super);

      function Tags() {
        return Tags.__super__.constructor.apply(this, arguments);
      }

      Tags.prototype.width = 210;

      Tags.prototype.tagName = 'input';

      Tags.prototype.initialize = function(options) {
        Tags.__super__.initialize.call(this, options);
        return this.tagboxValue = this.value || [];
      };

      Tags.prototype.render = function() {
        var _this = this;
        _.defer(function() {
          return _this.renderTagbox();
        });
        return this;
      };

      Tags.prototype.renderTagbox = function() {
        var onAdd, onRemove, _ref, _ref1, _ref2, _ref3, _ref4,
          _this = this;
        this.tagboxOptions = (_ref = this.schema.options) != null ? _ref : [];
        this.$el.tagbox({
          url: this.tagboxOptions,
          lowercase: (_ref1 = this.schema.lowercase) != null ? _ref1 : true,
          duplicates: (_ref2 = this.schema.duplicates) != null ? _ref2 : false,
          minLength: (_ref3 = this.schema.minLength) != null ? _ref3 : 1,
          maxLength: (_ref4 = this.schema.maxLength) != null ? _ref4 : 140
        });
        this.tagbox = this.$el.data('tagbox');
        onAdd = this.tagbox.settings.onAdd;
        this.tagbox.settings.onAdd = function() {
          onAdd();
          if (_this.updating) {
            return;
          }
          _this.onChange();
          return _this.updateTagboxOptions();
        };
        onRemove = this.tagbox.settings.onRemove;
        this.tagbox.settings.onRemove = function() {
          onRemove();
          if (_this.updating) {
            return;
          }
          return _this.onChange();
        };
        return this.updateTagbox();
      };

      Tags.prototype.getValue = function() {
        if (this.tagbox != null) {
          this.tagboxValue = this.tagbox.serialize().slice(0);
        }
        return this.tagboxValue || [];
      };

      Tags.prototype.setValue = function(value) {
        if (!_.isArray(value)) {
          return;
        }
        if (_.isEqual(value, this.tagboxValue)) {
          return;
        }
        this.tagboxValue = value;
        return this.updateTagbox();
      };

      Tags.prototype.updateTagbox = function() {
        var member, _i, _len, _ref;
        if (this.tagbox == null) {
          return;
        }
        this.updating = true;
        this.clearValue();
        _ref = this.tagboxValue;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          this.tagbox.add("" + member);
        }
        this.updating = false;
        return this.updateTagboxOptions();
      };

      Tags.prototype.clearValue = function() {
        var _ref, _results;
        _results = [];
        while (((_ref = this.tagbox.serialize()) != null ? _ref.length : void 0) > 0) {
          _results.push(this.tagbox.remove(0));
        }
        return _results;
      };

      Tags.prototype.onChange = function() {
        return this.trigger('change', this);
      };

      Tags.prototype.updateTagboxOptions = function() {
        var member, _i, _len, _ref, _results;
        if (!this.schema.updateAutoComplete) {
          return;
        }
        _ref = _.difference(this.tagbox.serialize(), this.tagboxOptions);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _results.push(this.tagboxOptions.push(member));
        }
        return _results;
      };

      return Tags;

    })(Form.editors.Base);
  });

}).call(this);
