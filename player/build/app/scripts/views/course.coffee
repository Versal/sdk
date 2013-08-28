define [
  'cdn.marionette'
  'text!templates/course.html'
  'views/lesson'
  'app/mediator'
  'plugins/tracker'
  '../../toc/main'
  'views/nav_buttons'
], (Marionette, template, LessonView, mediator, tracker, TOCView, NavButtonsView) ->

  class Course extends Marionette.Layout
    _.extend @::, tracker('Course')

    initialize: ->
      @_lessonTitleBlurrable = true
      @listenTo @model, 'change', @onCourseChanged, @
      @listenTo @model.lessons, 'add', @onLessonsAdd, @
      @listenTo @model.lessons, 'remove', @onLessonsRemove, @
      @listenTo @model.lessons, 'select', @onLessonSelected, @
      @listenTo @model.lessons, 'change:title', (model, title) => @updateTitle()
      @ensureLesson()

      mediator.on 'toc:show', => @ui.tocIcon.addClass 'active'
      mediator.on 'toc:hide', => @ui.tocIcon.removeClass 'active'

    ui:
      lessonTitle: '.lessonTitle'
      lessonTitleWrapper: '.lessonTitleWrapper'
      courseTitle: '.courseTitle'
      courseTitleWrapper: '.courseTitleWrapper'
      title: '.title'
      tocIcon: '.toc-icon'
      errorMsg: '.saveErrorMsg'

    regions:
      lessonRegion: '.lessons'
      toc: '.toc'
      nav: '.nav'

    events:
      'click .js-toggle-toc' : 'onToggleTOC'
      'click .lessonTitle': 'startEditingLessonTitle'
      'click .courseTitle': 'startEditingCourseTitle'

    template: _.template template

    itemView: LessonView
    itemViewContainer: '.lessons'

    className: ->
      if @options.embed then 'course embed-frame'
      else if @model.get('isEditable') then 'course editable'
      else 'course'

    serializeData: ->
      _.extend @model.toJSON(),
        firstLessonTitle: @model.lessons.first().get('title')

    ensureLesson: ->
      if @model.lessons.length is 0
        @model.lessons.create {}

    getLessonView: (lesson) ->
      @children.findByModel lesson

    activeLessonIndex: ->
      @model.lessons.indexOf @_activeLesson

    activateLesson: (lesson) ->
      @loadingLesson.abort() if @loadingLesson

      @renderingLesson = $.Deferred()

      if @model.lessons.indexOf(lesson) == -1 || lesson == @_activeLesson
        @renderingLesson.resolve()
        return false

      @stopEditingCourseTitle()
      @stopEditingLessonTitle()

      @loadingLesson = lesson.fetch()
      @loadingLesson.done => @displayLesson(lesson)

    displayLesson: (lesson) ->
      @_activeLesson = lesson

      @model.progress.save lessonIndex: (@activeLessonIndex() + 1)

      if @_lessonView
        @_lessonView.off 'menuDeactivated'
        @_lessonView.off 'itemview:dblclick'
        @_lessonView.close()

      @_lessonView = new LessonView(model: @_activeLesson, embed: @options.embed, isEditable: @model.get('isEditable'))
      @_lessonView.on 'menuDeactivated', @showHoverables, @
      @_lessonView.on 'itemview:dblclick', @onInstanceClicked, @

      @lessonRegion.show @_lessonView

      @renderingLesson.resolve() if @renderingLesson
      mediator.trigger 'lesson:rendered', @_lessonView

      @updateTitle()

      # Give browser a chance to resize "heavy" content (See #575)
      _.delay (-> window.scrollTo(0, 0)), 1000

    addNewLesson: (atIndex) ->
      index = atIndex or @activeLessonIndex() + 1
      # this should be included in api as default title
      @model.lessons.create {}, {at: index}
      @displayLesson @model.lessons.at(index)

    deleteLesson: (atIndex) ->
      index = atIndex or @activeLessonIndex()
      @model.lessons.destroy @model.lessons.at(@activeLessonIndex())

    startEditing: (field) ->
      return unless @model.get 'isEditable'
      field.toggleEdit true
      field.$el.parent().addClass 'editing'
      @_lessonView.showHoverables false

    startEditingCourseTitle: ->
      @startEditing @_courseTitle
      @_isEditingCourse = true

    startEditingLessonTitle: ->
      @startEditing @_lessonTitle
      @_isEditingLesson = true

    stopEditing: (model, field) ->
      model.save title: field.getPretty()
      field.toggleEdit false
      field.$el.parent().removeClass 'editing'
      @_lessonView.showHoverables true

    stopEditingCourseTitle: ->
      return unless @_isEditingCourse
      @stopEditing @model, @_courseTitle
      @_isEditingCourse = false
      @track 'Change Title', {
        course: @model.id
        title: @_courseTitle.getPretty()
      }

    stopEditingLessonTitle: ->
      return unless @_isEditingLesson
      @stopEditing @_activeLesson, @_lessonTitle
      @_isEditingLesson = false
      @track 'Change Lesson Title', {
        lesson: @_activeLesson.id
        title: @_lessonTitle.getPretty()
      }

    onCourseChanged: ->
      @updateTitle()

    onInstanceClicked: ->
      @stopEditingLessonTitle()
      @stopEditingCourseTitle()

    onLessonsRemove: (lesson, collection, options) ->
      if collection.length is 0
        @addNewLesson(0)
        @displayLesson(@model.lessons.at(0))
      if lesson is @_activeLesson
        index = Math.min(options.index, collection.length - 1)
        @activateLesson @model.lessons.at(index)

    onLessonSelected: (lesson) ->
      @activateLesson lesson

    onLessonsChange: ->
      @updateTitle()

    onRender: ->
      @_rendered = true

      @_lessonTitle = new vs.ui.EditableText
        el: @ui.lessonTitle
        type: 'input'
        complete: => @stopEditingLessonTitle()
        maxlength: 50

      @_courseTitle = new vs.ui.EditableText
        el: @ui.courseTitle,
        type: 'input'
        complete: => @stopEditingCourseTitle()
        maxlength: 60

      @activateLesson @_activeLesson || @model.lessons.first()

      @toc.show new TOCView model: @model
      @toc.ready = true
      @tocScroll = new vs.ui.Scroll @toc.$el

      @nav.show new NavButtonsView model: @model

      mediator.on 'api:xhr:error', @showSaveErrorMsg, @
      mediator.on 'api:xhr:success', @hideSaveErrorMsg, @

    scrollWidth: ->
      windowWidth = $(window).width()
      if windowWidth < 1024
        windowWidth
      else
        windowWidth - 263

    customScroller: =>
      @scroller = new vs.ui.Scroll $('html')

    onShow: ->
      @customScroller()

    onToggleTOC: =>
      mediator.trigger 'toc:toggle'
      @track 'Toggle ToC', {
        course: @model.id
      }

    updateTitle: ->
      return unless @_rendered
      @ui.lessonTitle.text @_activeLesson.get 'title'

    showLesson: (lessonIndex) ->
      lesson = @model.lessons.at(lessonIndex - 1)
      @activateLesson lesson

    showGadget: (lessonIndex, gadgetIndex) ->
      @showLesson lessonIndex

      @renderingLesson.done =>
        @_lessonView.showGadget gadgetIndex

    showSaveErrorMsg: ->
      unless @errorShowing || !@model.get('isEditable')
        @ui.errorMsg.slideDown(50)
        @errorShowing = true

    hideSaveErrorMsg: ->
      if @errorShowing
        @errorShowing = false
        @ui.errorMsg.slideUp(50)
