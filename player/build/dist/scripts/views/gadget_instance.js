(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define(['cdn.marionette', 'app/mediator', 'plugins/tracker', 'messages/facade', 'views/gadget_lock', 'views/gadget_comments', 'views/property_sheet', 'models/property_sheet_schema', 'models/children', 'text!templates/gadget_instance.html', 'text!templates/gadget_instance_error.html', 'text!templates/gadget_delete_warn.html', 'cdn.underscore'], function(Marionette, mediator, tracker, Facade, GadgetLockView, GadgetCommentsView, PropertySheetView, PropertySheetSchema, Children, template, error_template, warn_template, _) {
    var GadgetInstanceView;
    return GadgetInstanceView = (function(_super) {

      __extends(GadgetInstanceView, _super);

      function GadgetInstanceView() {
        this.onFetchSuccess = __bind(this.onFetchSuccess, this);

        this.onFetchError = __bind(this.onFetchError, this);
        return GadgetInstanceView.__super__.constructor.apply(this, arguments);
      }

      _.extend(GadgetInstanceView.prototype, tracker('Gadget'));

      GadgetInstanceView.prototype.reportActivityEveryMs = 60 * 1000;

      GadgetInstanceView.prototype.template = _.template(template);

      GadgetInstanceView.prototype.className = 'gadget';

      GadgetInstanceView.prototype.regions = {
        propertySheetRegion: '.js-property-dialog',
        lockRegion: '.lock',
        commentsRegion: '.toolbar-right'
      };

      GadgetInstanceView.prototype.events = {
        'click .js-draggable': 'onDraggableClick',
        'click .js-edit': 'onEditClick',
        'click .js-trash': 'onTrashClick',
        'click .js-hide': 'onHideClick',
        'click .js-delete': 'onDeleteClick',
        'click .js-undo-delete': 'onUndoDelete',
        'dblclick': 'onDblClick',
        'click .gadgetContent': 'onClick',
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
        this.currentLesson = options.currentLesson;
        this.comments = new vs.collab.GadgetComments;
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
        this.children = new Children(this.model.config.get('_children'), {
          parent: this,
          lesson: this.currentLesson
        });
        this.gadgetRendering = $.Deferred();
        this.once('gadgetRendered', function() {
          return _this.gadgetRendering.resolve();
        });
        this.model.userState.on('sync', function() {
          return _this.trigger('userStateSync');
        });
        this.listenTo(this.model, 'lock unlock', this.onLockChange);
        return mediator.on('course:click', this.onCourseClick, this);
      };

      GadgetInstanceView.prototype.onModelDestroy = function() {
        return mediator.trigger('gadget:deleted');
      };

      GadgetInstanceView.prototype.onBeforeClose = function() {
        return mediator.off('course:click', this.onCourseClick, this);
      };

      GadgetInstanceView.prototype.onInstanceAvailable = function() {
        var key;
        key = this.model.gadgetProject.cssClassName();
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
        if (!this.isEditable || this.noToggleSwitch || this.model.config.get('_hidden')) {
          return;
        }
        this.trigger('dblclick');
        if (!this._isEditing) {
          return this.onEditClick(e);
        }
      };

      GadgetInstanceView.prototype.onClick = function(e) {
        if (!(this.noToggleSwitch && !this._isEditing)) {
          return;
        }
        if (this.model.lock && !this.model.lock.isLockedByMe()) {
          this.onAlreadyLocked();
          return $(e.target).blur();
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
        options.$el = this.$('.gadgetContent');
        options.el = options.$el[0];
        options.propertySheetSchema = this._propertySheetSchema;
        options.config = this.model.config;
        options.userState = this.model.userState;
        options.children = this.children;
        options.userStates = this.model.userStates;
        options.model = this.model.config;
        options.facade = this._facade;
        options.properties = this.model.config;
        options.properties.propertySheetSchema = this._propertySheetSchema;
        options.$el = this.$('.gadgetContent');
        return options;
      };

      GadgetInstanceView.prototype.instantiateGadget = function(klass, options) {
        var defaultConfig, defaultUserState, gadget;
        if (options == null) {
          options = {};
        }
        defaultConfig = options.defaultConfig || {};
        defaultUserState = options.defaultUserState || {};
        this.noToggleSwitch = options.noToggleSwitch || false;
        this.model._gadgetKlass = klass;
        this.model.config.setDefaults(_.cloneDeep(defaultConfig));
        this.model.userState.setDefaults(defaultUserState);
        try {
          options = this.gadgetOptions();
          gadget = new klass(options, options.config.toJSON(), options.$el);
          this.onInstanceAvailable();
          if (this.isEditable) {
            if (this.noToggleSwitch) {
              this.passEvent('toggleEdit', true, {
                onLoad: !this.model.dropped
              });
              this.$el.addClass('noToggleEdit').addClass('editing');
              this.trigger('gadgetRendered');
            } else if (this.model.dropped) {
              this.toggleEdit(true);
            }
            if (this.model.dropped) {
              return mediator.trigger('gadget:drop', this);
            }
          }
        } catch (e) {
          this.showCouldNotLoad("Couldn't initialize gadget");
          throw e;
        }
      };

      GadgetInstanceView.prototype.onRender = function() {
        if (this.model._gadgetKlass) {
          this.instantiateGadget(this.model._gadgetKlass);
        }
        return this.initializeCollab();
      };

      GadgetInstanceView.prototype.onClose = function() {
        mediator.off('course:click', this.onCourseClick, this);
        return this.stopReportingActivity();
      };

      GadgetInstanceView.prototype.initializeCollab = function() {
        if (!vs.collab.enabled) {
          return;
        }
        this._lockView = new GadgetLockView({
          model: this.model
        });
        this.lockRegion.show(this._lockView);
        this._commentsView = new GadgetCommentsView({
          model: this.model,
          collection: this.comments
        });
        this.commentsRegion.show(this._commentsView);
        return this.startReportingActivity();
      };

      GadgetInstanceView.prototype.activityEvents = 'scroll mousedown DOMMouseScroll mousewheel keyup';

      GadgetInstanceView.prototype.startReportingActivity = function() {
        var triggerActivity, triggerActivityDebounced;
        triggerActivity = function() {
          return mediator.trigger('gadget:activity');
        };
        triggerActivityDebounced = _.debounce(triggerActivity, this.reportActivityEveryMs, true);
        this.ui.gadgetContent.on(this.activityEvents, triggerActivityDebounced);
        return mediator.on('course:click', triggerActivityDebounced);
      };

      GadgetInstanceView.prototype.stopReportingActivity = function() {
        this.ui.gadgetContent.off(this.activityEvents);
        return mediator.off('course:click');
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
        if (this._isEditing && this.model.lock) {
          this._isEditing = false;
          return this.onAlreadyLocked();
        }
        this.track('Toggle Editing', {
          editing: this._isEditing,
          gadget: this.model.id
        });
        if (!this.model.config.get('_hidden')) {
          if (this._isEditing) {
            this.trigger('edit', this);
            this.togglePropertySheet(true);
          } else {
            this.togglePropertySheet(false);
            this.trigger('doneEditing', this);
          }
        }
        this.$el.toggleClass('editing', this._isEditing);
        this.passEvent('toggleEdit', this._isEditing);
        this.updateLock();
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.onAlreadyLocked = function() {
        var lockUserName;
        lockUserName = this.model.lock.get('user').firstName;
        return alert("" + lockUserName + " is already editing this gadget!");
      };

      GadgetInstanceView.prototype.updateLock = function() {
        if (this._isEditing) {
          mediator.trigger('lock:locked', this.model);
          return this._initialConfig = _.cloneDeep(this.model.config.attributes);
        } else {
          mediator.trigger('lock:unlocked', this.model);
          if (!_.isEqual(this.model.config.attributes, this._initialConfig)) {
            delete this._initialConfig;
            return mediator.trigger('gadget:changed', this);
          }
        }
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

      GadgetInstanceView.prototype.onCourseClick = function(e) {
        var isClickOnCurrentView, _ref;
        isClickOnCurrentView = $.contains(this.el, e.target);
        if (!isClickOnCurrentView) {
          if ((_ref = this._commentsView) != null) {
            _ref.blur();
          }
          if (this._isEditing) {
            return this.toggleEdit(false);
          }
        }
      };

      GadgetInstanceView.prototype.onLockChange = function() {
        var isLocked;
        isLocked = !!this.model.lock && !this.model.lock.isLockedByMe();
        return this.$el.toggleClass('locked', isLocked);
      };

      GadgetInstanceView.prototype.onGadgetDrop = function(gadgetView) {
        if (gadgetView !== this) {
          return this.toggleEdit(false);
        }
      };

      return GadgetInstanceView;

    })(Marionette.Layout);
  });

}).call(this);
