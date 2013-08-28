define [
  'cdn.marionette'
  'text!templates/learner_sidebar.html'
  'text!templates/learner_sidebar_item.html'
  'app/mediator'
  'plugins/tracker'
  './sidebar'
], (Marionette, template, itemTemplate, mediator, tracker, Sidebar) ->

  class LearnerLesson extends Marionette.ItemView
    initialize: ->
      @model.on 'change', @render, @

    tagName: 'li'

    className: 'lesson'

    template: _.template itemTemplate

    events:
      'click': 'select'

    select: ->
      @trigger 'select', @model

    onRender: ->
      @$el.addClass 'disabled-lesson' unless @model.get 'isAccessible'

  class LearnerSidebar extends Marionette.CompositeView
    _.extend @::, Sidebar
    _.extend @::, tracker('Learner Sidebar')

    initialize: ->
      @model.on 'change', @render, @
      mediator.on 'lesson:rendered', @updateActiveLesson, @
      @collection = @model.lessons
      @on 'itemview:select', @selectLesson, @

    remove: ->
      mediator.off 'lesson:rendered', @updateActiveLesson, @
      super

    itemView: LearnerLesson

    itemViewContainer: '.lesson-list'

    className: 'learnerSidebar'

    template: _.template template

    events:
      'click .js-navigate-lesson': 'selectLesson'
      'click .versal-logo': 'onLogoClick'

    selectLesson: (lessonView) ->
      lesson = lessonView.model
      return unless lesson.get('isAccessible')
      mediator.trigger 'lesson:navigate', @model.lessons.indexOf(lesson) + 1
      @track 'Select lesson', { lesson: lesson.id }

    updateActiveLesson: (@activeView) ->
      lesson = @activeView.model
      @$('.active-lesson').removeClass 'active-lesson'
      @children.findByModel(lesson).$el.addClass 'active-lesson'

    templateHelpers: =>
      whitelabel: => @options.whitelabel

    onRender: ->
      @updateActiveLesson @activeView if @activeView
