(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(['cdn.underscore', 'cdn.backbone'], function(_, Backbone) {
    var PropertySheetSchema;
    return PropertySheetSchema = (function(_super) {

      __extends(PropertySheetSchema, _super);

      function PropertySheetSchema() {
        return PropertySheetSchema.__super__.constructor.apply(this, arguments);
      }

      PropertySheetSchema.prototype.whiteListedAttributes = {
        Text: [],
        Number: [],
        TextArea: [],
        Checkbox: [],
        Color: [],
        Select: ['options'],
        Radio: ['options'],
        Checkboxes: ['options'],
        Date: ['yearStart', 'yearEnd'],
        DateTime: ['yearStart', 'yearEnd', 'minsInterval'],
        Range: ['min', 'max', 'step'],
        Tags: ['options', 'lowercase', 'duplicates', 'minLength', 'maxLength', 'updateAutoComplete']
      };

      PropertySheetSchema.prototype.constantSchemaTop = function() {
        return {
          conceptTags: {
            type: 'Tags',
            updateAutoComplete: true
          }
        };
      };

      PropertySheetSchema.prototype.sanitizedSchema = function() {
        var attributes, name, sanitizedAttributes, schema, _ref;
        schema = {};
        _ref = this.attributes;
        for (name in _ref) {
          attributes = _ref[name];
          if (schema[name] == null) {
            sanitizedAttributes = this.sanitizedAttributes(attributes);
            if (sanitizedAttributes != null) {
              schema[name] = sanitizedAttributes;
            }
          }
        }
        return schema;
      };

      PropertySheetSchema.prototype.sanitizedAttributes = function(attributes) {
        var whiteListedAttributes;
        if (typeof attributes === 'string') {
          return this.sanitizedAttributes({
            type: attributes
          });
        }
        if (typeof attributes !== 'object') {
          return null;
        }
        whiteListedAttributes = this.whiteListedAttributes[attributes.type];
        if (whiteListedAttributes == null) {
          return null;
        }
        return _.pick.apply(_, [attributes, 'type', 'title', 'validators'].concat(__slice.call(whiteListedAttributes)));
      };

      PropertySheetSchema.prototype._defaultDefinitionForValue = function(value) {
        switch (typeof value) {
          case 'boolean':
            return 'Checkbox';
          case 'number':
            return 'Number';
          case 'string':
            if (/^\#[a-f0-9]{6}$/i.test(value)) {
              return 'Color';
            } else if (value.length > 20) {
              return 'TextArea';
            } else {
              return 'Text';
            }
            break;
          case 'object':
            if (_.isArray(value) && _.every(value, function(member) {
              var _ref;
              return (_ref = typeof member) === 'string' || _ref === 'number';
            })) {
              return {
                type: 'Tags',
                options: _.uniq(value),
                updateAutoComplete: true
              };
            } else {
              return null;
            }
            break;
          default:
            return null;
        }
      };

      return PropertySheetSchema;

    })(Backbone.Model);
  });

}).call(this);
