define [
  'cdn.marionette'
  'text!templates/course.html'
  'views/lesson'
], (Marionette, template, LessonView) ->

  class CourseOverview extends Marionette.CompositeView
