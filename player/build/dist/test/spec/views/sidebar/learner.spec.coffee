define [
  'helpers/fixtures'
  'views/sidebar/learner'
  'views/lesson'
  'app/mediator'
], (Fixtures, LearnerSidebarView, LessonView, mediator) ->

  describe 'Learner Sidebar View', ->

    beforeEach ->
      @model = new vs.api.Course Fixtures.BlockedCourse(), { parse: true }
      @view = new LearnerSidebarView model: @model

    afterEach ->
      @view.close()

    describe 'Versal logo', ->
      it 'should be visible, generally', ->
        @view.render().$el.find('.versal-logo').length.should.eq 1

      it 'should not be visible if whitelabeled', ->
        @view.options.whitelabel = true
        @view.render().$el.find('.versal-logo').length.should.eq 0

    describe 'Sidebar items', ->
      beforeEach ->
        @view.render()

      it 'should become active when a lesson is navigated to', ->
        fakeLessonView = new LessonView model: @model.lessons.first()
        mediator.trigger 'lesson:rendered', fakeLessonView
        @view.$el.find('.lesson').first().hasClass('active-lesson').should.eq true

      it 'should activate a lesson when clicked upon', ->
        mediatorSpy = sinon.spy mediator, 'trigger'
        $(@view.$el.find('.lesson')[1]).click()
        mediatorSpy.called.should.be.true
        mediatorSpy.getCall(0).args[0].should.eq 'lesson:navigate'
        mediatorSpy.getCall(0).args[1].should.eq 2
        mediatorSpy.restore()

      describe 'when it represents an inaccessible lesson', ->
        it 'should be disabled', ->
          @view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be.true

        describe 'and it becomes accessible', ->
          it 'should be enabled', ->
            @view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be.true
            @model.lessons.last().set isAccessible: true
            @view.render()
            @view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be.false

      describe 'when it represents an accessible lesson', ->
        it 'should be enabled', ->
          @view.$el.find('.lesson').first().hasClass('disabled-lesson').should.be.false
