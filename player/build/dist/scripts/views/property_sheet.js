(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['app/mediator', 'plugins/tracker', 'cdn.marionette', 'text!templates/property_sheet.html', 'libs/backbone-forms', 'libs/backbone-forms.bootstrap', 'views/backbone-forms/color', 'views/backbone-forms/range', 'views/backbone-forms/tags'], function(mediator, tracker, Marionette, template, Form) {
    var PropertySheetView;
    return PropertySheetView = (function(_super) {

      __extends(PropertySheetView, _super);

      function PropertySheetView() {
        return PropertySheetView.__super__.constructor.apply(this, arguments);
      }

      _.extend(PropertySheetView.prototype, tracker('Property Sheet'));

      PropertySheetView.prototype.template = _.template(template);

      PropertySheetView.prototype.className = 'properties-dialog';

      PropertySheetView.prototype.events = {
        'change input[type=number]': 'onFormChange',
        'submit .js-form': 'doNothing'
      };

      PropertySheetView.prototype.ui = {
        form: '.js-form',
        errorCount: '.js-error-count',
        errorCountPlural: '.js-error-count-plural',
        errorCountContainer: '.js-error-count-container'
      };

      PropertySheetView.prototype.initialize = function() {
        this.listenTo(this.options.config, 'change', this.onConfigChange);
        return this.listenTo(this.options.propertySheetSchema, 'change', this.onSchemaChange);
      };

      PropertySheetView.prototype.onConfigChange = function(model, options) {
        if (!options.propertySheetChanging) {
          this.render();
        }
        return this.track('Change Config', {
          gadget: this.options.model.id,
          changed: this.options.config.changedAttributes()
        });
      };

      PropertySheetView.prototype.onSchemaChange = function() {
        return this.render();
      };

      PropertySheetView.prototype.setErrorCount = function(count) {
        this.ui.errorCount.text(count);
        this.ui.errorCountPlural.toggle(count !== 1);
        return this.ui.errorCountContainer.toggle(count > 0);
      };

      PropertySheetView.prototype.onRender = function() {
        var errors;
        if (this.form != null) {
          this.stopListening(this.form);
        }
        this.form = new Form({
          data: this.options.config.toJSON(),
          schema: this.options.propertySheetSchema.sanitizedSchema()
        });
        this.form.render();
        errors = this.form.validate();
        this.setErrorCount(_.size(errors));
        this.listenTo(this.form, 'change', this.onFormChange);
        return this.ui.form.html(this.form.el);
      };

      PropertySheetView.prototype.doNothing = function(e) {
        return e.preventDefault();
      };

      PropertySheetView.prototype.onFormChange = function() {
        this.form.validate();
        return this.options.config.save(this.form.getValue(), {
          propertySheetChanging: true
        });
      };

      return PropertySheetView;

    })(Marionette.ItemView);
  });

}).call(this);
