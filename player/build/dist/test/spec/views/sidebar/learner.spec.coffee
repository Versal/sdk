define [
  'helpers/fixtures'
  'views/sidebar/learner'
  'views/lesson'
  'app/mediator'
], (Fixtures, LearnerSidebarView, LessonView, mediator) ->

  describe 'Learner Sidebar View', ->

    beforeEach ->
      @model = new vs.api.Course Fixtures.Course(), { parse: true }
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
      it 'should become active when a lesson is navigated to', ->
        @view.render()
        fakeLessonView = new LessonView model: @model.lessons.first()
        mediator.trigger 'lesson:rendered', fakeLessonView
        @view.$el.find('.lesson').first().hasClass('active-lesson').should.eq true

      it 'should activate a lesson when clicked upon', ->
        mediatorSpy = sinon.spy mediator, 'trigger'
        @view.render()
        $(@view.$el.find('.lesson')[2]).click()
        mediatorSpy.called.should.be.true
        mediatorSpy.getCall(0).args[0].should.eq 'lesson:navigate'
        mediatorSpy.getCall(0).args[1].should.eq 3
        mediatorSpy.restore()
