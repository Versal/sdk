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

        it 'should load requested course', ->
          courseId = 'some-course-uuid'
          stub = sinon.stub PlayerApplication::, 'loadCourse'
          new PlayerApplication api: {}, courseId: courseId
          stub.calledWith(courseId).should.be.true
          stub.restore()

      describe 'When no courseId is provided', ->

        it 'should load empty course', ->
          loadSpy = sinon.spy PlayerApplication::, 'buildCourse'
          new PlayerApplication api: {}
          loadSpy.called.should.be.true
          loadSpy.restore()

    describe '.loadCourse', ->

      beforeEach ->
        @player = new PlayerApplication api: {}

      afterEach ->
        Backbone.history.stop()

      it 'should fetch the course model', ->
        courseId = 42
        fetchStub = sinon.stub vs.api.Course::, 'fetch'
        @player.loadCourse courseId
        fetchStub.called.should.be.true
        fetchStub.restore()

    describe '.onCourseLoad', ->

      beforeEach ->
        @player = new PlayerApplication api: {}
        @course = new vs.api.Course Fixtures.Course(), { parse: true }
        @showSpy = sinon.spy @player.layout.sidebar, 'show'

      afterEach ->
        @showSpy.restore()
        $('.sidebar').html('')
        Backbone.history.stop()

      it 'should show the author sidebar in the left rail if the course is editable and not embedded', ->
        @player.options.embed = false
        @course.set isEditable: true
        @player.onCourseLoad @course
        @showSpy.called.should.be.true
        @player.layout.sidebar.$el.find('.authorSidebar').length.should.eq 1

      it 'should not show the author sidebar in the left rail if the course is embedded', ->
        @player.options.embed = true
        @course.set isEditable: true
        @player.onCourseLoad @course
        @showSpy.called.should.be.true
        @player.layout.sidebar.$el.find('.authorSidebar').length.should.eq 0

      it 'should show the learner sidebar if the course is not editable', ->
        @course.set isEditable: false
        @player.onCourseLoad @course
        @showSpy.called.should.be.true
        @player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq 1

    describe 'registerStylesheet', ->
      beforeEach ->
        @player = new PlayerApplication api: {}

      it 'should create LINK tag in document head', (done) ->
        links = document.head.getElementsByTagName('link').length
        @player.registerStylesheet 'some/file.css', ->
          document.head.getElementsByTagName('link').length.should.equal links + 1
          done()
