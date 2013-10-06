(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'app/mediator', 'plugins/tracker', 'views/gadget_instance', 'app/catalogue', 'plugins/vs-sticky', 'cdn.jqueryui'], function(Marionette, mediator, tracker, GadgetInstanceView, gadgetCatalogue, VsSticky) {
    var Lesson, cacheStamp;
    cacheStamp = (new Date).getTime();
    _.extend(vs.api.Gadget.prototype, {
      onResolveError: function(error) {
        console.error(error);
        return this.trigger('resolve:error', error);
      },
      onResolveSuccess: function(klass) {
        return this.trigger('resolve:success', klass, {
          defaultConfig: this.gadgetProject.get('defaultConfig'),
          defaultUserState: this.gadgetProject.get('defaultUserState'),
          noToggleSwitch: this.gadgetProject.get('noToggleSwitch')
        });
      },
      nocache: function(url) {
        return "" + url + "?_=" + cacheStamp;
      },
      resolve: function(opts) {
        var key, klass;
        if (opts == null) {
          opts = {};
        }
        _.bindAll(this, 'onResolveSuccess', 'onResolveError');
        if (!this.gadgetProject) {
          return this.onResolveError("Gadget Project not found: " + (this.get('type')));
        }
        if (this.gadgetProject.css()) {
          key = this.gadgetProject.cssClassName();
          if (this.gadgetProject.has('_newCss')) {
            mediator.trigger('player:style:register', {
              key: key,
              url: this.gadgetProject.css()
            });
          } else {
            mediator.trigger('style:register', {
              key: key,
              href: this.nocache(this.gadgetProject.css()),
              files: this.gadgetProject.get('files')
            });
          }
        }
        if (klass = this.gadgetProject.get('classDefinition')) {
          return this.onResolveSuccess(klass);
        } else {
          require.config({
            baseUrl: 'scripts'
          });
          return require([this.nocache(_.result(this.gadgetProject, 'main'))], this.onResolveSuccess, this.onResolveError);
        }
      }
    });
    return Lesson = (function(_super) {

      __extends(Lesson, _super);

      function Lesson() {
        this.onSortStop = __bind(this.onSortStop, this);

        this.onSortStart = __bind(this.onSortStart, this);

        this.onSortReceive = __bind(this.onSortReceive, this);

        this.onSortOver = __bind(this.onSortOver, this);

        this.itemViewOptions = __bind(this.itemViewOptions, this);
        return Lesson.__super__.constructor.apply(this, arguments);
      }

      _.extend(Lesson.prototype, tracker('Lesson'));

      Lesson.prototype.initialize = function(options) {
        var _this = this;
        if (options == null) {
          options = {};
        }
        this.collection = this.model.gadgets;
        this.catalogue = options.catalogue || gadgetCatalogue;
        this.activeView = null;
        this.embed = options.embed;
        this.isEditable = options.isEditable;
        this.on('itemview:edit', this.onItemViewEdit, this);
        this.on('itemview:doneEditing', this.onItemViewDoneEditing, this);
        this.on('itemview:userStateSync', function() {
          return _this.trigger('userStateSync');
        });
        this.listenTo(this.catalogue, 'ready', this.onCatalogueReady, this);
        return $(window).on('resize', function() {
          return _this.fixSizing();
        });
      };

      Lesson.prototype.className = 'gadgets';

      Lesson.prototype.itemView = GadgetInstanceView;

      Lesson.prototype.itemViewOptions = function() {
        return {
          isEditable: this.isEditable,
          currentLesson: this
        };
      };

      Lesson.prototype.insertGadgetTypeAt = function(type, index, initialConfig) {
        var instance;
        if (initialConfig == null) {
          initialConfig = {};
        }
        if (instance = this.catalogue.buildInstanceOfType(type)) {
          instance.dropped = true;
          instance.set({
            index: index
          });
          instance.config.set(initialConfig);
          this.collection.create(instance, {
            at: index
          });
          instance.resolve();
          this.fixSizing();
          this.track('Add Gadget', {
            type: type,
            lesson: this.model.id
          });
          return instance;
        } else {
          return console.error('Failed grabbing gadget ' + type);
        }
      };

      Lesson.prototype.makeSortable = function() {
        return this.$el.sortable({
          handle: '.js-draggable',
          containment: 'parent',
          axis: 'y',
          forceHelperSize: true,
          forcePlaceholderSize: true,
          tolerance: 'pointer',
          over: this.onSortOver,
          receive: this.onSortReceive,
          start: this.onSortStart,
          stop: this.onSortStop,
          scrollSensitivity: 40
        });
      };

      Lesson.prototype.resolveGadgets = function() {
        var _this = this;
        return this.collection.each(function(instance) {
          var project;
          project = _this.catalogue.findGadgetByType(instance.get('type'));
          instance.gadgetProject = project;
          return instance.resolve();
        });
      };

      Lesson.prototype.onCatalogueReady = function() {
        return this.resolveGadgets();
      };

      Lesson.prototype.onItemViewEdit = function(activeView) {
        var _ref;
        if ((_ref = this.activeView) != null) {
          _ref.toggleEdit(false);
        }
        this.activeView = activeView;
        this.trigger('menuDeactivated', false);
        return this.children.each(function(itemView) {
          if (itemView !== activeView) {
            return itemView.showHoverables(false);
          }
        });
      };

      Lesson.prototype.onItemViewDoneEditing = function(activeView) {
        this.activeView = null;
        this.trigger('menuDeactivated', true);
        return this.children.each(function(itemView) {
          return itemView.showHoverables();
        });
      };

      Lesson.prototype.onSortOver = function(e, ui) {
        return ui.placeholder.animate({
          height: ui.helper.height()
        });
      };

      Lesson.prototype.onSortReceive = function(e, ui) {
        return this.insertGadgetTypeAt(ui.item.data('type'), ui.item.index());
      };

      Lesson.prototype.onSortStart = function(e, ui) {
        ui.item.find('.fixed').removeClass('fixed');
        ui.item.data('originalPosition', ui.item.index());
        ui.placeholder.height(ui.item.height() - 16);
        return ui.item.find('.toolbar').addClass("dragging");
      };

      Lesson.prototype.onSortStop = function(e, ui) {
        var _this = this;
        return _.defer(function() {
          var newIndex, oldIndex, popped;
          oldIndex = ui.item.data('originalPosition');
          newIndex = ui.item.index();
          popped = _this.collection.at(oldIndex);
          _this.collection.move(popped, newIndex);
          ui.item.find('.toolbar').removeClass("dragging");
          _this.stickHeaders();
          return _this.track('Reorder Gadget', {
            gadget: popped.id,
            from: oldIndex,
            to: newIndex
          });
        });
      };

      Lesson.prototype.onRender = function() {
        this.makeSortable();
        if (this.catalogue.isReady()) {
          this.resolveGadgets();
        }
        this.navBarHeight = $('.courseHeader').height();
        this.fixSizing();
        if (this.children.length === 0) {
          mediator.trigger('gadget:rendered', null, true);
        }
        return this.track('Render', {
          lesson: this.model.id
        });
      };

      Lesson.prototype.fixSizing = function() {
        var _this = this;
        return _.defer(function() {
          return _this.$el.css({
            "min-height": $(window).height() - $('.courseHeader').height() - 45
          });
        });
      };

      Lesson.prototype.appendHtml = function(collectionView, itemView, index) {
        var children,
          _this = this;
        if (itemView.isChild()) {
          this.onGadgetRendered(itemView);
          return false;
        }
        children = this.$el.children();
        if (children.size() <= index) {
          this.$el.append(itemView.el);
        } else {
          children.eq(index).before(itemView.el);
        }
        this.fixSizing();
        return itemView.on('gadgetRendered', function() {
          return _this.onGadgetRendered(itemView);
        });
      };

      Lesson.prototype.onGadgetRendered = function(itemView) {
        var renderedAll;
        itemView.rendered = true;
        renderedAll = this.children.every(function(i) {
          return i.rendered;
        });
        if (renderedAll) {
          this.stickHeaders();
        }
        return mediator.trigger('gadget:rendered', itemView, renderedAll);
      };

      Lesson.prototype.stickHeaders = function() {
        var _this = this;
        return _.defer(function() {
          if (!_this.sticky) {
            _this.sticky = new VsSticky(_this.$('.js-sticky-header'), _this.navBarHeight);
            _this.sticky.listen();
          }
          _this.sticky.setEls(_this.$('.js-sticky-header'));
          return _this.sticky.updateEls();
        });
      };

      Lesson.prototype.showHoverables = function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.children.each(function(itemView) {
          return itemView.showHoverables(bool);
        });
      };

      Lesson.prototype.showGadget = function(gadgetIndex) {
        var gadget,
          _this = this;
        gadget = this.children.findByIndex(gadgetIndex - 1);
        return gadget.gadgetRendering.done(function() {
          return _.defer(function() {
            return window.scrollTo(0, gadget.$el.offset().top - _this.navBarHeight);
          });
        });
      };

      Lesson.prototype.isComplete = function() {
        return this.model.gadgets.every(function(gadget) {
          var _ref;
          return (gadget.get('type') !== '6/quiz@1.0.04') || (((_ref = gadget.userState.get('results')) != null ? _ref.pass : void 0) === true);
        });
      };

      Lesson.prototype.isEmbedded = function() {
        return this.embed;
      };

      return Lesson;

    })(Marionette.CollectionView);
  });

}).call(this);
