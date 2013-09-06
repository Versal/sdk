(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/loading.html'], function(Marionette, template) {
    var LoadingView;
    return LoadingView = (function(_super) {

      __extends(LoadingView, _super);

      function LoadingView() {
        return LoadingView.__super__.constructor.apply(this, arguments);
      }

      LoadingView.prototype.className = 'loading-page';

      LoadingView.prototype.template = _.template(template);

      LoadingView.prototype.onRender = function() {
        return new vs.ui.LoadingIndicator(this.$('.spin-holder'));
      };

      LoadingView.prototype.hide = function(cb) {
        var _this = this;
        return this.$('.loading-overlay').fadeOut(400, function() {
          return typeof cb === "function" ? cb() : void 0;
        });
      };

      return LoadingView;

    })(Marionette.ItemView);
  });

}).call(this);
