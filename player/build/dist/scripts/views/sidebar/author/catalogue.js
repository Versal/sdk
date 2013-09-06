(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['app/mediator', 'plugins/tracker', 'cdn.marionette', 'text!templates/author_sidebar/catalogue.html', './gadget', 'app/catalogue', 'plugins/backbone.filter'], function(mediator, tracker, Marionette, template, GadgetCard, gadgetCatalogue) {
    var SidebarCatalogueView, includedInTypes;
    includedInTypes = Backbone.Filter.extend({
      defaults: {
        field: 'type',
        types: []
      },
      run: function(collection) {
        var _this = this;
        return collection.select(function(model) {
          return _this.options.types.indexOf(model.get(_this.options.field)) >= 0;
        });
      }
    });
    return SidebarCatalogueView = (function(_super) {

      __extends(SidebarCatalogueView, _super);

      function SidebarCatalogueView() {
        this.onSortStop = __bind(this.onSortStop, this);

        this.onSortReceive = __bind(this.onSortReceive, this);

        this.onSortStart = __bind(this.onSortStart, this);
        return SidebarCatalogueView.__super__.constructor.apply(this, arguments);
      }

      _.extend(SidebarCatalogueView.prototype, tracker('Sidebar Catalogue'));

      SidebarCatalogueView.prototype.className = 'gadget-catalogue js-gadget-catalogue';

      SidebarCatalogueView.prototype.template = _.template(template);

      SidebarCatalogueView.prototype.itemView = GadgetCard;

      SidebarCatalogueView.prototype.itemViewContainer = '.js-gadgets';

      SidebarCatalogueView.prototype.appendHtml = function(cv, iv) {
        if (iv.model.get('hidden')) {
          return;
        }
        if (iv.model.get('catalog') === 'approved') {
          return cv.$('.approved').after(iv.el);
        } else if (iv.model.get('catalog') === 'sandbox') {
          cv.$('h3.approved, h3.sandbox').show();
          return cv.$('.sandbox').after(iv.el);
        } else if (iv.model.get('catalog') === 'pending') {
          cv.$('h3.approved, h3.pending').show();
          return cv.$('.pending').after(iv.el);
        }
      };

      SidebarCatalogueView.prototype.ui = {
        gadgetList: '.js-gadgets'
      };

      SidebarCatalogueView.prototype.events = {
        'click .js-show-list-view': 'showListView',
        'click .js-show-tile-view': 'showTileView'
      };

      SidebarCatalogueView.prototype.initialize = function(opts) {
        var _this = this;
        if (opts == null) {
          opts = {};
        }
        this.catalogue = opts.catalogue || gadgetCatalogue;
        this.collection = new this.catalogue.constructor(this.catalogue.models);
        this.listenTo(this.catalogue, 'reset', function() {
          return _this.collection.reset(_this.catalogue.models);
        });
        return $(window).on('resize', function() {
          return _this.fixSizing();
        });
      };

      SidebarCatalogueView.prototype.onRender = function() {
        var _this = this;
        this.on('itemview:expand', this.onItemViewExpanded, this);
        this.ui.gadgetList.sortable({
          items: '.gadgetCard',
          connectWith: '.gadgets',
          delay: 100,
          placeholder: 'hidden atom-placeholder',
          helper: 'clone',
          receive: this.onSortReceive,
          start: this.onSortStart,
          stop: this.onSortStop,
          over: _.identity(false)
        });
        return _.defer(function() {
          return _this.fixSizing();
        });
      };

      SidebarCatalogueView.prototype.changeView = function(type) {
        var _this = this;
        this.$('.card-options i').addClass('inactive');
        this.$("." + type + "-view").removeClass('inactive');
        return this.ui.gadgetList.fadeOut(100, function() {
          return _this.ui.gadgetList.removeClass('list-view tile-view').addClass(type + '-view').fadeIn(100);
        });
      };

      SidebarCatalogueView.prototype.showListView = function() {
        this.changeView('list');
        return this.track('Show List View');
      };

      SidebarCatalogueView.prototype.showTileView = function(e) {
        this.changeView('tile');
        return this.track('Show Tile View');
      };

      SidebarCatalogueView.prototype.onItemViewExpanded = function(itemView) {
        return _.each(this.children.without(itemView), function(itemView) {
          return itemView.toggleExpansion(false);
        });
      };

      SidebarCatalogueView.prototype.onSortStart = function(e, ui) {
        this.track('Start Dragging', {
          gadget: ui.helper.data('type')
        });
        ui.item.addClass('dragging');
        ui.item.removeClass('expanded').show();
        ui.helper.removeClass('expanded').show();
        ui.helper.addClass('atom');
        return ui.helper.css({
          width: 1,
          height: 'auto'
        }).hide().fadeIn(200, function() {
          return ui.helper.addClass('fullWidth');
        });
      };

      SidebarCatalogueView.prototype.onSortReceive = function(e, ui) {
        return false;
      };

      SidebarCatalogueView.prototype.onSortStop = function(e, ui) {
        ui.item.removeClass('dragging');
        ui.item.removeAttr('style');
        return false;
      };

      SidebarCatalogueView.prototype.fixSizing = function() {
        return this.ui.gadgetList.height(document.documentElement.clientHeight - this.ui.gadgetList.position().top - 20);
      };

      return SidebarCatalogueView;

    })(Marionette.CompositeView);
  });

}).call(this);
