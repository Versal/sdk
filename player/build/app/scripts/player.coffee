define [
  'cdn.marionette'
  'views/course'
  'views/sidebar/author/author'
  'views/sidebar/learner'
  'app/catalogue'
  'text!templates/player.html'
  'views/loading'
  'app/mediator'
  'plugins/tracker'
  'messages/decorate'
  'modernizr'
  'plugins/vs.ui'
  'models/video' # this is vs.Video and attaches itself here, needs more treatment
], (Marionette, CourseView, AuthorSidebarView, LearnerSidebarView, gadgetCatalogue, template, LoadingView, mediator, tracker) ->

  class PlayerLayout extends Marionette.Layout
    template: template

    regions:
      sidebar: '.sidebar'
      dialogs: '.dialogs'
      courseContainer: '.container'
      position: '.scrubBar'
      loading: '.loadingCourse'

  class PlayerRouter extends Backbone.Router
    initialize: ->
      mediator.on 'lesson:navigate', @navigateLesson, @
      @on 'route:showLesson route:showGadget route:showCourse', @updateId, @

      router = @

      $(document).on 'click', 'a.js-navigate', ->
        router.navigate "courses/#{router.courseId}/#{$(@).attr('href')}", { trigger: true }
        return false

    routes:
      'learn': 'learn'
      'courses/:courseId': 'showCourse'
      'courses/:courseId/lessons/:lessonIndex': 'showLesson'
      'courses/:courseId/lessons/:lessonIndex/gadgets/:gadgetIndex': 'showGadget'

    updateId: (@courseId) ->

    navigateLesson: (lessonIndex) ->
      @navigate "courses/#{@courseId}/lessons/#{lessonIndex}", { trigger: true }

    navigateGadget: (lessonIndex, gadgetIndex) ->
      @navigate "courses/#{@courseId}/lessons/#{lessonIndex}/gadgets/#{gadgetIndex}", { trigger: true }

  class PlayerApplication
    _.extend @::, tracker('Player')

    defaults:
      whitelabel: false
      embed: false

    constructor: (options) ->
      unless _.has options, 'api'
        throw new Error 'Please set options.api!'

      vs.api.init options.api
      vs.api.on 'xhr:start', (xhr) =>
        @startTimer xhr.requestUrl
      vs.api.on 'xhr:error', (opts, e, xhr) =>
        @endTimer xhr.requestUrl, { status: 'error' }
        mediator.trigger 'api:xhr:error'
      vs.api.on 'xhr:success', (opts, e, xhr) =>
        @endTimer xhr.requestUrl, { status: 'success' }
        mediator.trigger 'api:xhr:success'

      @baseUrl = if options && options.requireRoot then options.requireRoot else '/'
      @baseUrl += '/' unless @baseUrl.match(/\/$/)
      require.config baseUrl: @baseUrl

      mediator.on 'player:style:register', @registerStylesheet, @

      @_courseRendering = $.Deferred()
      @_courseRendering.done =>
        mediator.trigger 'course:rendered', @courseView

      @router = new PlayerRouter
      @options = _.extend {}, @defaults, options

      courseId = @options.courseId

      @trackerSetup
        sessionId: @options.api.sessionId
        interactionId: _.random(1e15,1e16).toString(32)

      if courseId then @router.courseId = courseId

      @router.on 'route:showLesson', @showLesson, @
      @router.on 'route:showGadget', @showGadget, @
      @router.on 'route:learn', @becomeLearner, @
      Backbone.history.start({ root: window.location.pathname })

      if @options.container
        el = $(@options.container).get(0)

      @layout = new PlayerLayout { el }
      @layout.render()

      @loadingView = new LoadingView
      @layout.loading.show @loadingView
      mediator.on 'gadget:rendered', (g, all) =>
        @loadingView.hide (=> @layout.loading.reset()) if all

      # Defer building/loading course until the gadget catalogue
      # is available. This needs to be replaced by a "ready" event
      # to be repeated as new gadgets are added to the catalogue
      gadgetCatalogue.fetchAll()
      #gadgetCatalogue.fetchApproved()

      if @router.courseId
        @loadCourse @router.courseId
      else
        @buildCourse()

    isLearner: false

    becomeLearner: -> @isLearner = true

    registerStylesheet: (url, errorCallback) ->
      url = @baseUrl + url
      link = document.createElement 'link'
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', url)
      document.head.appendChild link

      #Beautiful hack to ensure the stylesheet has been loaded
      if errorCallback
        img = document.createElement('img')
        img.onerror = -> errorCallback()
        img.src = url

    buildCourse: ->
      course = new vs.api.Course
        lessons: [{ title: 'lesson 1' }]
      @onCourseLoad course

    loadCourse: (courseId) ->
      @track 'Begin Loading', { course: courseId }
      courseModel = new vs.api.Course { id: courseId }
      courseModel.set isEditable: false

      progressFetch = courseModel.progress.fetch()
      progressFetch.success @onProgressLoad

      # Hacky fix for lack of revision endpoint.
      # Allows us to fetch the last published
      # version of a course
      if @options.revision
        courseBaseUrl = courseModel.url()
        courseModel.url = =>
          @baseUrl + 'catalogs/staged' + courseBaseUrl

      courseModel.fetch
        success: (model) =>
          $.when(progressFetch).then => @onCourseLoad model
        silent: true

      # Hacky fix for lack of revision endpoint.
      # Resets the course to use the correct URL
      if @options.revision
        courseModel.url = -> courseBaseUrl

      # Store reference to the current course inside the Player app
      @course = courseModel

    handleException: (e) ->
      if e instanceof vs.api.errors.ApplicationError
        console.log 'app error'
      else if e instanceof vs.api.errors.NotFound
        console.log 'not found'
      else if e instanceof vs.api.errors.PermissionDenied
        console.log 'permission denied'
      else
        console.log 'error'

    onCourseLoad: (courseModel) =>
      @track 'Finish Loading', {
        course: courseModel.id
        editable: courseModel.get('isEditable')
      }

      if @options.noEditable || @isLearner || @options.embed
        courseModel.set isEditable: false

      viewOpts =
        embed: @options.embed
        model: courseModel
        whitelabel: @options.whitelabel

      @courseView = new CourseView viewOpts

      @layout.courseContainer.show @courseView

      if courseModel.get('isEditable')
        @layout.sidebar.show new AuthorSidebarView viewOpts
      else
        @layout.sidebar.show new LearnerSidebarView viewOpts

      # TODO Fix this mess! We don't want further fetches to reset things
      # deeply; one possible solution is an API change.

      courseModel.parse = (attrs) ->
        attrs.lessons = _.map attrs.lessons, (lesson) ->
          _.omit lesson, 'gadgets'
        @lessons.set attrs.lessons
        _.omit attrs, 'lessons'

      @_courseRendering.resolve()

    onProgressLoad: (model = {}) =>
      if model.lessonIndex
        if model.gadgetIndex
          @router.navigateGadget model.lessonIndex, model.gadgetIndex
        else
          @router.navigateLesson model.lessonIndex

    showLesson: (courseId, lessonIndex) ->
      @_courseRendering.done =>
        @courseView.showLesson lessonIndex

    showGadget: (courseId, lessonIndex, gadgetIndex) ->
      @_courseRendering.done =>
        @courseView.showGadget lessonIndex, gadgetIndex
