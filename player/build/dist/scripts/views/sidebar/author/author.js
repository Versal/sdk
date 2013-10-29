(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/author_sidebar/author_sidebar.html', 'app/mediator', 'plugins/tracker', 'plugins/time_since', './catalogue', 'views/sidebar/sidebar', 'cdn.jqueryui'], function(Marionette, template, mediator, tracker, timeSince, SidebarCatalogueView, Sidebar) {
    var AuthorSidebar;
    return AuthorSidebar = (function(_super) {

      __extends(AuthorSidebar, _super);

      function AuthorSidebar() {
        this.templateHelpers = __bind(this.templateHelpers, this);

        this.onAjaxComplete = __bind(this.onAjaxComplete, this);
        return AuthorSidebar.__super__.constructor.apply(this, arguments);
      }

      _.extend(AuthorSidebar.prototype, Sidebar);

      _.extend(AuthorSidebar.prototype, tracker('Author Sidebar'));

      AuthorSidebar.prototype.className = 'authorSidebar';

      AuthorSidebar.prototype.template = _.template(template);

      AuthorSidebar.prototype.initialize = function() {
        var _this = this;
        $(document).ajaxComplete(this.onAjaxComplete);
        this.lastSavedTime = +(new Date());
        return setInterval(function() {
          return _this.updateSavedLabel();
        }, 10 * 1000);
      };

      AuthorSidebar.prototype.events = {
        'click .js-publish': 'onPublishClick',
        'click .versal-logo': 'onLogoClick'
      };

      AuthorSidebar.prototype.regions = {
        'catalogue': '.js-catalogue'
      };

      AuthorSidebar.prototype.ui = {
        'lastSavedTime': '.timestamp'
      };

      AuthorSidebar.prototype.onRender = function() {
        return this.catalogue.show(new SidebarCatalogueView({
          course: this.model
        }));
      };

      AuthorSidebar.prototype.onAjaxComplete = function() {
        this.lastSavedTime = +(new Date);
        return this.updateSavedLabel();
      };

      AuthorSidebar.prototype.updateSavedLabel = function() {
        return this.ui.lastSavedTime.html(timeSince(this.lastSavedTime));
      };

      AuthorSidebar.prototype.onPublishClick = function() {
        mediator.trigger('parent:notify', {
          event: "publishCourse"
        });
        return this.track('Click Publish');
      };

      AuthorSidebar.prototype.templateHelpers = function() {
        var _this = this;
        return {
          whitelabel: function() {
            return _this.options.whitelabel;
          }
        };
      };

      return AuthorSidebar;

    })(Marionette.Layout);
  });

}).call(this);
