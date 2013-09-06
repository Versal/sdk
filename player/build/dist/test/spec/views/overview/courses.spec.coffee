define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/overview/courses'
], (Helpers, Fixtures, CoursesView) ->

  beforeEach ->
    @model = new CoursesView

  describe 'Courses View', ->
