(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/inline_catalogue_item.html', 'text!templates/inline_catalogue.html', 'app/catalogue', 'app/mediator'], function(Marionette, itemTemplate, template, gadgetCatalogue, mediator) {
    var InlineCatalogueItem, InlineCatalogueView;
    InlineCatalogueItem = (function(_super) {

      __extends(InlineCatalogueItem, _super);

      function InlineCatalogueItem() {
        return InlineCatalogueItem.__super__.constructor.apply(this, arguments);
      }

      InlineCatalogueItem.prototype.tagName = 'li';

      InlineCatalogueItem.prototype.template = _.template(itemTemplate);

      InlineCatalogueItem.prototype.events = {
        click: 'select'
      };

      InlineCatalogueItem.prototype.select = function() {
        return this.trigger('select');
      };

      return InlineCatalogueItem;

    })(Marionette.ItemView);
    return InlineCatalogueView = (function(_super) {

      __extends(InlineCatalogueView, _super);

      function InlineCatalogueView() {
        return InlineCatalogueView.__super__.constructor.apply(this, arguments);
      }

      InlineCatalogueView.prototype.className = 'inlineCatalogue';

      InlineCatalogueView.prototype.itemView = InlineCatalogueItem;

      InlineCatalogueView.prototype.itemViewContainer = '.items';

      InlineCatalogueView.prototype.initialize = function() {
        this.collection = gadgetCatalogue;
        return this.on('itemview:select', this.createInstance);
      };

      InlineCatalogueView.prototype.events = function() {
        return {
          'click .cancel': 'onCancelClick'
        };
      };

      InlineCatalogueView.prototype.onCancelClick = function() {
        return this.trigger('selectCanceled');
      };

      InlineCatalogueView.prototype.createInstance = function(view) {
        return this.trigger('selectGadget', view.model.get('type'));
      };

      InlineCatalogueView.prototype.template = function() {
        return _.template(template);
      };

      return InlineCatalogueView;

    })(Marionette.CompositeView);
  });

}).call(this);
