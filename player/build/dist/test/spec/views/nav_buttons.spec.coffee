define [
  'helpers/fixtures'
  'views/nav_buttons'
  'views/lesson'
  'app/mediator'
], (Fixtures, NavButtonsView, LessonView, mediator) ->

  describe 'Lesson Navigation buttons', ->
    beforeEach ->
      @model = new vs.api.Course Fixtures.Course(), { parse: true }
      @view = new NavButtonsView model: @model
      @view.render()

    afterEach ->
      @view.remove()

    describe 'on the first lesson', ->
      beforeEach ->
        fakeLessonView = new LessonView model: @model.lessons.first()
        mediator.trigger 'lesson:rendered', fakeLessonView

      it 'shouldnt show a previous button', ->
        @view.$el.find('.previous-button').length.should.eq 0

      it 'should show a next button', ->
        @view.$el.find('.next-button').length.should.eq 1

      it 'shouldnt show a finish button', ->
        @view.$el.find('.finish-button').length.should.eq 0

    describe 'on a middle lesson', ->
      beforeEach ->
        fakeLessonView = new LessonView model: @model.lessons.at(1)
        mediator.trigger 'lesson:rendered', fakeLessonView

      it 'should show a previous button', ->
        @view.$el.find('.previous-button').length.should.eq 1

      it 'should show a next button', ->
        @view.$el.find('.next-button').length.should.eq 1

      it 'shouldnt show a finish button', ->
        @view.$el.find('.finish-button').length.should.eq 0

    describe 'on the last lesson', ->
      beforeEach ->
        fakeLessonView = new LessonView model: @model.lessons.at(2)
        mediator.trigger 'lesson:rendered', fakeLessonView

      it 'should show a previous button', ->
        @view.$el.find('.previous-button').length.should.eq 1

      it 'shouldnt show a next button', ->
        @view.$el.find('.next-button').length.should.eq 0

      it 'should show a finish button', ->
        @view.$el.find('.finish-button').length.should.eq 1

      it 'should have text on finish button', ->
        @view.$el.find('.finish-button').text().should.include 'finish course'

    describe 'embedded lessons', ->
      it 'should have text on next button when embedded', ->
        fakeLessonView = new LessonView model: @model.lessons.first()
        fakeLessonView.embed = true
        mediator.trigger 'lesson:rendered', fakeLessonView
        @view.$el.find('.next-button').text().should.include 'next lesson'

      it 'should have text on previous button when embedded', ->
        fakeLessonView = new LessonView model: @model.lessons.at(1)
        fakeLessonView.embed = true
        mediator.trigger 'lesson:rendered', fakeLessonView
        @view.$el.find('.previous-button').text().should.include 'previous lesson'


    it 'should take you to the next lesson when next is clicked', ->
      fakeLessonView = new LessonView model: @model.lessons.first()
      mediator.trigger 'lesson:rendered', fakeLessonView

      mediatorSpy = sinon.spy mediator, 'trigger'

      @view.$el.find('.next-button').click()

      mediatorSpy.called.should.be.true
      mediatorSpy.getCall(0).args[0].should.eq 'lesson:navigate'
      mediatorSpy.getCall(0).args[1].should.eq 2

      mediatorSpy.restore()

    it 'should take you to the previous lesson when previous is clicked', ->
      fakeLessonView = new LessonView model: @model.lessons.at(1)
      mediator.trigger 'lesson:rendered', fakeLessonView

      mediatorSpy = sinon.spy mediator, 'trigger'

      @view.$el.find('.previous-button').click()

      mediatorSpy.called.should.be.true
      mediatorSpy.getCall(0).args[0].should.eq 'lesson:navigate'
      mediatorSpy.getCall(0).args[1].should.eq 1

      mediatorSpy.restore()

    it 'should trigger a postMessage when finish is clicked', ->
      fakeLessonView = new LessonView model: @model.lessons.at(2)
      mediator.trigger 'lesson:rendered', fakeLessonView

      postMessageStub = sinon.stub window, 'postMessage'

      @view.$el.find('.finish-button').click()

      postMessageStub.called.should.be.true
      postMessageStub.getCall(0).args[0].should.eq JSON.stringify { event: 'courseEnd' }
      postMessageStub.restore()
