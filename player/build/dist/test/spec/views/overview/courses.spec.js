(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/overview/courses'], function(Helpers, Fixtures, CoursesView) {
    beforeEach(function() {
      return this.model = new CoursesView;
    });
    return describe('Courses View', function() {});
  });

}).call(this);
