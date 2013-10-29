(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/author_sidebar/sidebar_gadget.html'], function(Marionette, template) {
    var SidebarGadget;
    return SidebarGadget = (function(_super) {

      __extends(SidebarGadget, _super);

      function SidebarGadget() {
        return SidebarGadget.__super__.constructor.apply(this, arguments);
      }

      SidebarGadget.prototype.template = _.template(template);

      SidebarGadget.prototype.className = 'gadgetCard js-gadgetCard';

      SidebarGadget.prototype.events = {
        'click': 'onClick'
      };

      SidebarGadget.prototype.initialize = function() {
        if (_.isFunction(this.model.type)) {
          this.$el.attr('data-type', this.model.type());
        }
        return this.model.set({
          title: this.model.get('title') || this.model.get('name')
        }, {
          silent: true
        });
      };

      SidebarGadget.prototype.attributes = function() {
        return {
          'data-gadget-id': this.model.id
        };
      };

      SidebarGadget.prototype.ui = {
        icon: '.icon',
        title: '.title'
      };

      SidebarGadget.prototype.iconPath = function() {
        var checksum, originalUrl, serverIndex;
        originalUrl = this.model.path('assets/icon.png');
        checksum = _.reduce(originalUrl.split(''), function(memo, val) {
          return memo + val.charCodeAt(0);
        }, 0);
        serverIndex = checksum % 10;
        return originalUrl.replace(/^(https?:\/\/)((staging)?stack)/, "$1$2-" + serverIndex);
      };

      SidebarGadget.prototype.onRender = function() {
        return this.ui.icon.css("background-image", "url(" + (this.iconPath()) + ")");
      };

      SidebarGadget.prototype.onClick = function(e) {
        e.preventDefault();
        return this.toggleExpansion();
      };

      SidebarGadget.prototype.toggleExpansion = function(force) {
        this.$el.toggleClass('expanded', force);
        if (this.$el.hasClass('expanded')) {
          return this.trigger('expand', this);
        }
      };

      return SidebarGadget;

    })(Marionette.ItemView);
  });

}).call(this);
