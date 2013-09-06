(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/course.html', 'views/lesson'], function(Marionette, template, LessonView) {
    var CourseOverview;
    return CourseOverview = (function(_super) {

      __extends(CourseOverview, _super);

      function CourseOverview() {
        return CourseOverview.__super__.constructor.apply(this, arguments);
      }

      return CourseOverview;

    })(Marionette.CompositeView);
  });

}).call(this);
