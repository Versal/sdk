define [
  'helpers/helpers'
  'helpers/fixtures'
  'app/player'
  'app/catalogue'
  'plugins/vs.api'
], (Helpers, Fixtures, PlayerApplication, gadgetCatalogue) ->

  root = @

  describe 'PlayerApplication', ->

    beforeEach ->
      @fetchGadgets = sinon.stub gadgetCatalogue, 'fetchAll'
      @fetchLesson = sinon.stub vs.api.Lesson::, 'fetch', -> $.Deferred()

    afterEach ->
      @fetchGadgets.restore()
      @fetchLesson.restore()
      Backbone.history.stop()

    describe 'Initializing', ->

      describe 'When a courseId is provided', ->
        courseId = 'some-course-uuid'

        beforeEach ->
          sinon.stub PlayerApplication::, 'loadCourse'
          new PlayerApplication api: {}, courseId: courseId

        afterEach ->
          PlayerApplication::loadCourse.restore()

        it 'should load requested course', ->
          PlayerApplication::loadCourse.calledWith(courseId).should.be.true

      describe 'When no courseId is provided', ->
        beforeEach ->
          sinon.spy PlayerApplication::, 'buildCourse'
          new PlayerApplication api: {}

        afterEach ->
          PlayerApplication::buildCourse.restore()

        it 'should load empty course', ->
          PlayerApplication::buildCourse.called.should.be.true

    describe '.loadCourse', ->
      courseId = '42'

      beforeEach ->
        sinon.stub vs.api.Course::, 'fetch'
        @player = new PlayerApplication api: {}
        @player.loadCourse courseId

      afterEach ->
        Backbone.history.stop()
        vs.api.Course::fetch.restore()

      it 'should fetch the course model', ->
        vs.api.Course::fetch.called.should.be.true

    describe '.onCourseLoad', ->

      beforeEach ->
        @player = new PlayerApplication api: {}
        @course = new vs.api.Course Fixtures.Course(), { parse: true }
        sinon.spy @player.layout.sidebar, 'show'
        sinon.stub @course, 'start'

      afterEach ->
        @player.layout.sidebar.show.restore()
        @course.start.restore()
        $('.sidebar').html('')
        Backbone.history.stop()

      describe 'when the course is editable and not embedded', ->
        beforeEach ->
          @player.options.embed = false
          @course.set isEditable: true
          @player.onCourseLoad @course

        it 'should show a sidebar', ->
          @player.layout.sidebar.show.called.should.be.true

        it 'should show an author sidebar', ->
          @player.layout.sidebar.$el.find('.authorSidebar').length.should.eq 1

      describe 'when the course is embedded', ->
        beforeEach ->
          @player.options.embed = true
          @course.set isEditable: true
          @player.onCourseLoad @course

        it 'should show a sidebar', ->
          @player.layout.sidebar.show.called.should.be.true

        it 'should show a learner sidebar', ->
          @player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq 1

      describe 'when the course is not editable and not embedded', ->
        beforeEach ->
          @course.set isEditable: false
          @player.onCourseLoad @course

          it 'should show a sidebar', ->
            @player.layout.sidebar.show.called.should.be.true

          it 'should show a learner sidebar', ->
            @player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq 1

      describe 'when the course has no position set', ->
        beforeEach ->
          @course.set currentPosition: null
          @player.onCourseLoad @course

        it 'should start it', ->
          @course.start.called.should.be.true

      describe 'when the course has a position set', ->
        beforeEach ->
          @course.set currentPosition: { currentLesson: 1 }
          @player.onCourseLoad @course

        it 'should not start it', ->
          @course.start.called.should.be.false

    describe 'registerStylesheet', ->
      beforeEach ->
        @player = new PlayerApplication api: {}

      it 'should create LINK tag in document head', ->
        @player.registerStylesheet { key: 'k1', url: 'some/file.css' }
        $('link.k1').attr('href').should.eq 'some/file.css'

