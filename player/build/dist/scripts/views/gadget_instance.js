(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(['cdn.marionette', 'app/mediator', 'plugins/tracker', 'messages/facade', 'views/property_sheet', 'models/property_sheet_schema', 'text!templates/gadget_instance.html', 'text!templates/gadget_instance_error.html', 'text!templates/gadget_delete_warn.html', 'cdn.lodash'], function(Marionette, mediator, tracker, Facade, PropertySheetView, PropertySheetSchema, template, error_template, warn_template, _) {
    var GadgetInstanceView;
    return GadgetInstanceView = (function(_super) {

      __extends(GadgetInstanceView, _super);

      function GadgetInstanceView() {
        this.onFetchSuccess = __bind(this.onFetchSuccess, this);

        this.onFetchError = __bind(this.onFetchError, this);
        return GadgetInstanceView.__super__.constructor.apply(this, arguments);
      }

      _.extend(GadgetInstanceView.prototype, tracker('Gadget'));

      GadgetInstanceView.prototype.template = _.template(template);

      GadgetInstanceView.prototype.className = 'gadget';

      GadgetInstanceView.prototype.regions = {
        propertySheetRegion: '.js-property-dialog'
      };

      GadgetInstanceView.prototype.events = {
        'click .js-draggable': 'onDraggableClick',
        'click .js-edit': 'onEditClick',
        'click .js-trash': 'onTrashClick',
        'click .js-hide': 'onHideClick',
        'click .js-delete': 'onDeleteClick',
        'click .js-undo-delete': 'onUndoDelete',
        'dblclick': 'onDblClick',
        'selectstart .js-placeholder': _.identity(false)
      };

      GadgetInstanceView.prototype.ui = {
        toolbar: '.toolbar',
        gadgetContent: '.gadgetContent'
      };

      GadgetInstanceView.prototype.initialize = function(options) {
        var saveDebounced,
          _this = this;
        if (options == null) {
          options = {};
        }
        this.isEditable = options.isEditable;
        this.listenTo(this.model, 'resolve:success', this.onFetchSuccess, this);
        this.listenTo(this.model, 'resolve:error', this.onFetchError, this);
        this._facade = new Facade({
          model: this.model
        });
        this._facade.on('doneEditing', this.onFacadeDoneEditing, this);
        saveDebounced = _.debounce(this.saveGadgetConfig, 200);
        this._facade.on('registerPropertySheet', this.onRegisterPropertySheet, this);
        this._facade.on('configChange', this.onFacadeChange, this);
        this._facade.on('configEmpty', this.onGadgetConfigEmpty, this);
        this._facade.on('save', saveDebounced, this);
        this._facade.on('cancelEditing', this.onGadgetCancelEdit, this);
        this.listenTo(this.model, 'change', this.onPropertiesChange);
        this.listenTo(this.model.config, 'change', this.onGadgetConfigChange, this);
        this.listenTo(this.model, 'destroy', this.onModelDestroy);
        this._propertySheetSchema = new PropertySheetSchema;
        this.gadgetRendering = $.Deferred();
        this.once('gadgetRendered', function() {
          return _this.gadgetRendering.resolve();
        });
        return this.model.userState.on('sync', function() {
          return _this.trigger('userStateSync');
        });
      };

      GadgetInstanceView.prototype.onInstanceAvailable = function() {
        var key;
        key = 'gadget-' + this.model.gadgetProject.get('id');
        this.ui.gadgetContent.addClass(key);
        this.passEvent('domReady');
        this.passEvent('render');
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.onTrashClick = function() {
        this.toggleEdit(false);
        return this.showDeleteMsg();
      };

      GadgetInstanceView.prototype.onHideClick = function() {
        return this.$el.fadeOut(1200);
      };

      GadgetInstanceView.prototype.showDeleteMsg = function() {
        var height, warnMsg;
        if (this.deleteShowing) {
          return;
        }
        this.deleteShowing = true;
        height = this.$el.height();
        warnMsg = $(warn_template);
        if (height < 100) {
          warnMsg.addClass('minimized');
        }
        return this.$el.append(warnMsg);
      };

      GadgetInstanceView.prototype.onUndoDelete = function() {
        this.deleteShowing = false;
        return this.$el.find('.js-alert-warn').remove();
      };

      GadgetInstanceView.prototype.onDeleteClick = function() {
        this.track('Destroy', {
          gadget: this.model.id
        });
        this.passEvent('domRemove');
        return this.model.destroy();
      };

      GadgetInstanceView.prototype.onDraggableClick = function() {};

      GadgetInstanceView.prototype.onEditClick = function(e) {
        e.stopPropagation();
        return this.toggleEdit();
      };

      GadgetInstanceView.prototype.onDblClick = function(e) {
        if (!this.isEditable) {
          return;
        }
        this.trigger('dblclick');
        if (!this._isEditing) {
          return this.onEditClick(e);
        }
      };

      GadgetInstanceView.prototype.isChild = function() {
        return !!this.model.config.get('_hidden');
      };

      GadgetInstanceView.prototype.onPropertiesChange = function(model, options) {
        return this.passEvent('configChange', this.model.config.toJSON());
      };

      GadgetInstanceView.prototype.onFacadeDoneEditing = function() {
        return this.toggleEdit(false);
      };

      GadgetInstanceView.prototype.onFetchError = function(err) {
        return this.showCouldNotLoad(err);
      };

      GadgetInstanceView.prototype.onFetchSuccess = function(klass, options) {
        if (options == null) {
          options = {};
        }
        return this.instantiateGadget(klass, options);
      };

      GadgetInstanceView.prototype.gadgetOptions = function() {
        var options;
        options = this._facade;
        options.player = this._facade;
        options.el = this.$('.gadgetContent')[0];
        options.propertySheetSchema = this._propertySheetSchema;
        options.config = this.model.config;
        options.userState = this.model.userState;
        options.userStates = this.model.userStates;
        options.model = this.model.config;
        options.facade = this._facade;
        options.properties = this.model.config;
        options.properties.propertySheetSchema = this._propertySheetSchema;
        options.$el = this.$('.gadgetContent');
        return options;
      };

      GadgetInstanceView.prototype.instantiateGadget = function(klass, options) {
        var defaultConfig, defaultUserState, gadget, noToggleSwitch;
        if (options == null) {
          options = {};
        }
        defaultConfig = options.defaultConfig || {};
        defaultUserState = options.defaultUserState || {};
        noToggleSwitch = options.noToggleSwitch || false;
        this.model._gadgetKlass = klass;
        this.model.config.setDefaults(_.cloneDeep(defaultConfig));
        this.model.userState.setDefaults(defaultUserState);
        try {
          options = this.gadgetOptions();
          gadget = new klass(options, options.config.toJSON(), options.$el);
          this.onInstanceAvailable();
          if (this.isEditable) {
            if (noToggleSwitch) {
              this.passEvent('toggleEdit', true, {
                onLoad: !this.model.dropped
              });
              this.$el.addClass('noToggleEdit').addClass('editing');
              this.trigger('gadgetRendered');
              return this.toggleEdit = (function() {});
            } else if (this.model.dropped) {
              return this.toggleEdit(true);
            }
          }
        } catch (e) {
          this.showCouldNotLoad("Couldn't initialize gadget");
          throw e;
        }
      };

      GadgetInstanceView.prototype.onRender = function() {
        if (this.model._gadgetKlass) {
          return this.instantiateGadget(this.model._gadgetKlass);
        }
      };

      GadgetInstanceView.prototype.passEvent = function() {
        var args, event, _ref;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (this.model._gadgetKlass) {
          return (_ref = this._facade).trigger.apply(_ref, [event].concat(__slice.call(args)));
        }
      };

      GadgetInstanceView.prototype.showCouldNotLoad = function(errorDescription) {
        this.$el.html(_.template(error_template, {
          errorDescription: errorDescription
        }));
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.onRegisterPropertySheet = function(schema) {
        this._propertySheetSchema.clear({
          silent: true
        });
        return this._propertySheetSchema.set(schema);
      };

      GadgetInstanceView.prototype.showPropertySheet = function() {
        if (this._propertySheetSchema.keys().length === 0) {
          return;
        }
        if (!this._propertySheetView) {
          this._propertySheetView = new PropertySheetView({
            model: this.model,
            config: this.model.config,
            propertySheetSchema: this._propertySheetSchema
          });
          this.propertySheetRegion.show(this._propertySheetView);
        }
        return this._propertySheetView.$el.hide().show('fast');
      };

      GadgetInstanceView.prototype.hidePropertySheet = function() {
        if (this._propertySheetView) {
          return this._propertySheetView.$el.hide();
        }
      };

      GadgetInstanceView.prototype.toggleEdit = function(force) {
        var bool;
        bool = _.isBoolean(force);
        if (bool && force === this._isEditing) {
          return;
        }
        this._isEditing = bool ? force : !this._isEditing;
        this.track('Toggle Editing', {
          editing: this._isEditing,
          gadget: this.model.id
        });
        if (this._isEditing) {
          this.trigger('edit', this);
          this.togglePropertySheet(true);
        } else {
          this.togglePropertySheet(false);
          this.trigger('doneEditing', this);
        }
        this.$el.toggleClass('editing', this._isEditing);
        this.passEvent('toggleEdit', this._isEditing);
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.toggleEmpty = function(force) {
        var bool;
        bool = _.isBoolean(force);
        if (bool && force === this._isEmpty) {
          return;
        }
        this._isEmpty = bool ? force : !this._isEmpty;
        if (this._isEmpty) {
          this._emptyState = this.model.config.toJSON();
        }
        return this.$el.toggleClass('empty', this._isEmpty);
      };

      GadgetInstanceView.prototype.showHoverables = function(bool) {
        var elements;
        if (bool == null) {
          bool = true;
        }
        elements = $().add(this.ui.toolbar.add(this.ui.gadgetContent.add(this.$el)));
        return elements.toggleClass('blocked', !bool);
      };

      GadgetInstanceView.prototype.togglePropertySheet = function(force) {
        var bool;
        bool = _.isBoolean(force);
        if (bool && force === this._configVisible) {
          return;
        }
        this._configVisible = bool ? force : !this._configVisible;
        if (this._configVisible) {
          this.toggleEdit(true);
          return this.showPropertySheet();
        } else {
          return this.hidePropertySheet();
        }
      };

      GadgetInstanceView.prototype.onFacadeChange = function(attributes) {
        return this.model.config.set(attributes);
      };

      GadgetInstanceView.prototype.saveGadgetConfig = function(attributes) {
        if (attributes == null) {
          attributes = {};
        }
        return this.model.config.save(attributes);
      };

      GadgetInstanceView.prototype.onGadgetConfigChange = function() {
        if (this._emptyState && !_.isEqual(this.model.config.toJSON(), this._emptyState)) {
          return this.toggleEmpty(false);
        }
      };

      GadgetInstanceView.prototype.onGadgetCancelEdit = function() {
        return this.toggleEdit(false);
      };

      GadgetInstanceView.prototype.onGadgetConfigEmpty = function() {
        return this.toggleEmpty(true);
      };

      return GadgetInstanceView;

    })(Marionette.Layout);
  });

}).call(this);
