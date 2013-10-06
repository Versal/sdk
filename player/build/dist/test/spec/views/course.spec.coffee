define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/course'
  'app/mediator'
], (Helpers, Fixtures, CourseView, mediator) ->

  describe 'Course View', ->

    beforeEach ->
      @model = new vs.api.Course Fixtures.Course()
      @view = new CourseView model: @model
      @fetchStub = sinon.stub vs.api.Lesson::, 'fetch', ->
        fetch = $.Deferred()
        fetch.abort = sinon.stub()
        fetch.resolve = sinon.stub()
        fetch.done = (f) -> f()
        fetch

    afterEach ->
      @fetchStub.restore()

    describe 'Initialization', ->
      it 'should ensure at least one lesson exists', ->
        @model = new vs.api.Course Fixtures.Course()
        @model.lessons.reset([])
        @model.lessons.size().should.equal 0
        @view = new CourseView model: @model
        @model.lessons.size().should.equal 1

    describe 'Rendering', ->
      it 'should activate first lesson', ->
        firstLesson = @model.lessons.first()
        spy = sinon.spy @view, 'activateLesson'
        @view.render()
        spy.calledWith(firstLesson).should.be.true
        spy.restore()

    describe 'Activating lessons', ->
      beforeEach ->
        @lesson = @model.lessons.last()
        @view.render()

      describe 'when the lesson is not in the course', ->
        it 'should fail', ->
          otherLesson = new vs.api.Lesson
          @view.activateLesson(otherLesson).should.be.false

      describe 'when the lesson is the active lesson', ->
        it 'should fail', ->
          @view._activeLesson = @lesson # Can't feel good about this anywhere but a unit test.
          @view.activateLesson(@lesson).should.be.false

      it 'should fetch the lesson', ->
        @view._activeLesson = null # Can't feel good about this anywhere but a unit test.
        @view.activateLesson @lesson
        @fetchStub.called.should.be.true

      it 'should save the course progress', ->
        progressStub = sinon.stub vs.api.CourseProgress::, 'save'
        @view._activeLesson = null # Can't feel good about this anywhere but a unit test.
        @view.activateLesson @lesson
        progressStub.called.should.be.true
        progressStub.restore()

    describe 'Displaying lessons', ->

      beforeEach ->
        @lesson = @model.lessons.last()

      it 'should render the lesson view', ->
        @view.displayLesson @lesson
        @view.lessonRegion.currentView.model.should.eq @lesson

      it 'updates the lesson title', ->
        spy = sinon.spy @view, 'updateTitle'
        @view.displayLesson @lesson
        spy.called.should.be.true
        spy.restore()

    describe 'Clicking', ->

      describe 'When a user clicks on the course', ->

        it 'should notify other views', ->
          sinon.stub CourseView::, 'isModalOpen', -> false
          sinon.stub mediator, 'trigger'

          @view.render()

          $('body').click()
          [name] =  mediator.trigger.lastCall.args
          name.should.eq 'course:click'

          CourseView::isModalOpen.restore()
          mediator.trigger.restore()

        describe 'and a modal is open', ->

          it 'should not notify other views', ->
            sinon.stub CourseView::, 'isModalOpen', -> true
            sinon.stub mediator, 'trigger'

            @view.render()

            $('body').click()
            [name] =  mediator.trigger.lastCall.args
            name.should.not.eq 'course:click'

            CourseView::isModalOpen.restore()
            mediator.trigger.restore()

    describe 'Modal', ->

      describe 'when open', ->

        it 'should be detectable', ->
          @view.render()
          $('body').append $('<div class="modal"></div>')
          @view.isModalOpen().should.be.true

      describe 'when closed', ->

        it 'should be detectable', ->
          @view.render()
          $('.modal').remove()
          @view.isModalOpen().should.be.false
