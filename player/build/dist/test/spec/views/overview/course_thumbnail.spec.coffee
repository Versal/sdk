define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/overview/course_thumbnail'
], (Helpers, Fixtures, CourseThumbnailView) ->

  beforeEach ->
    @model = new CourseThumbnailView

  describe 'Course Thumbnail View', ->
