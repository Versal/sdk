(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/overview/course_thumbnail'], function(Helpers, Fixtures, CourseThumbnailView) {
    beforeEach(function() {
      return this.model = new CourseThumbnailView;
    });
    return describe('Course Thumbnail View', function() {});
  });

}).call(this);
