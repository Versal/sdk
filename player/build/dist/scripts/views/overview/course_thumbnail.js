(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette'], function(Marionette) {
    var CourseThumbnailView;
    return CourseThumbnailView = (function(_super) {

      __extends(CourseThumbnailView, _super);

      function CourseThumbnailView() {
        return CourseThumbnailView.__super__.constructor.apply(this, arguments);
      }

      return CourseThumbnailView;

    })(Marionette.ItemView);
  });

}).call(this);
