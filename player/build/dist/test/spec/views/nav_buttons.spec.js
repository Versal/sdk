(function() {

  define(['helpers/fixtures', 'views/nav_buttons', 'views/lesson', 'app/mediator'], function(Fixtures, NavButtonsView, LessonView, mediator) {
    return describe('Lesson Navigation buttons', function() {
      beforeEach(function() {
        this.model = new vs.api.Course(Fixtures.Course(), {
          parse: true
        });
        this.view = new NavButtonsView({
          model: this.model
        });
        return this.view.render();
      });
      afterEach(function() {
        return this.view.remove();
      });
      describe('on the first lesson', function() {
        beforeEach(function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.first()
          });
          return mediator.trigger('lesson:rendered', fakeLessonView);
        });
        it('shouldnt show a previous button', function() {
          return this.view.$el.find('.previous-button').length.should.eq(0);
        });
        it('should show a next button', function() {
          return this.view.$el.find('.next-button').length.should.eq(1);
        });
        return it('shouldnt show a finish button', function() {
          return this.view.$el.find('.finish-button').length.should.eq(0);
        });
      });
      describe('on a middle lesson', function() {
        beforeEach(function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.at(1)
          });
          return mediator.trigger('lesson:rendered', fakeLessonView);
        });
        it('should show a previous button', function() {
          return this.view.$el.find('.previous-button').length.should.eq(1);
        });
        it('should show a next button', function() {
          return this.view.$el.find('.next-button').length.should.eq(1);
        });
        return it('shouldnt show a finish button', function() {
          return this.view.$el.find('.finish-button').length.should.eq(0);
        });
      });
      describe('on the last lesson', function() {
        beforeEach(function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.at(2)
          });
          return mediator.trigger('lesson:rendered', fakeLessonView);
        });
        it('should show a previous button', function() {
          return this.view.$el.find('.previous-button').length.should.eq(1);
        });
        it('shouldnt show a next button', function() {
          return this.view.$el.find('.next-button').length.should.eq(0);
        });
        it('should show a finish button', function() {
          return this.view.$el.find('.finish-button').length.should.eq(1);
        });
        return it('should have text on finish button', function() {
          return this.view.$el.find('.finish-button').text().should.eq('finish course');
        });
      });
      describe('embedded lessons', function() {
        it('should have text on next button when embedded', function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.first()
          });
          fakeLessonView.embed = true;
          mediator.trigger('lesson:rendered', fakeLessonView);
          return this.view.$el.find('.next-button').text().should.eq('next lesson');
        });
        return it('should have text on previous button when embedded', function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.at(1)
          });
          fakeLessonView.embed = true;
          mediator.trigger('lesson:rendered', fakeLessonView);
          return this.view.$el.find('.previous-button').text().should.eq('previous lesson');
        });
      });
      it('should take you to the next lesson when next is clicked', function() {
        var fakeLessonView, mediatorSpy;
        fakeLessonView = new LessonView({
          model: this.model.lessons.first()
        });
        mediator.trigger('lesson:rendered', fakeLessonView);
        mediatorSpy = sinon.spy(mediator, 'trigger');
        this.view.$el.find('.next-button').click();
        mediatorSpy.called.should.be["true"];
        mediatorSpy.getCall(0).args[0].should.eq('lesson:navigate');
        mediatorSpy.getCall(0).args[1].should.eq(2);
        return mediatorSpy.restore();
      });
      it('should take you to the previous lesson when previous is clicked', function() {
        var fakeLessonView, mediatorSpy;
        fakeLessonView = new LessonView({
          model: this.model.lessons.at(1)
        });
        mediator.trigger('lesson:rendered', fakeLessonView);
        mediatorSpy = sinon.spy(mediator, 'trigger');
        this.view.$el.find('.previous-button').click();
        mediatorSpy.called.should.be["true"];
        mediatorSpy.getCall(0).args[0].should.eq('lesson:navigate');
        mediatorSpy.getCall(0).args[1].should.eq(1);
        return mediatorSpy.restore();
      });
      return it('should trigger a postMessage when finish is clicked', function() {
        var fakeLessonView, postMessageStub;
        fakeLessonView = new LessonView({
          model: this.model.lessons.at(2)
        });
        mediator.trigger('lesson:rendered', fakeLessonView);
        postMessageStub = sinon.stub(window, 'postMessage');
        this.view.$el.find('.finish-button').click();
        postMessageStub.called.should.be["true"];
        postMessageStub.getCall(0).args[0].should.eq(JSON.stringify({
          event: 'courseEnd'
        }));
        return postMessageStub.restore();
      });
    });
  });

}).call(this);
