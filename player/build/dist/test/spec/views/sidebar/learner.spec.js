(function() {

  define(['helpers/fixtures', 'views/sidebar/learner', 'views/lesson', 'app/mediator'], function(Fixtures, LearnerSidebarView, LessonView, mediator) {
    return describe('Learner Sidebar View', function() {
      beforeEach(function() {
        this.model = new vs.api.Course(Fixtures.BlockedCourse(), {
          parse: true
        });
        return this.view = new LearnerSidebarView({
          model: this.model
        });
      });
      afterEach(function() {
        return this.view.close();
      });
      describe('Versal logo', function() {
        it('should be visible, generally', function() {
          return this.view.render().$el.find('.versal-logo').length.should.eq(1);
        });
        return it('should not be visible if whitelabeled', function() {
          this.view.options.whitelabel = true;
          return this.view.render().$el.find('.versal-logo').length.should.eq(0);
        });
      });
      return describe('Sidebar items', function() {
        beforeEach(function() {
          return this.view.render();
        });
        it('should become active when a lesson is navigated to', function() {
          var fakeLessonView;
          fakeLessonView = new LessonView({
            model: this.model.lessons.first()
          });
          mediator.trigger('lesson:rendered', fakeLessonView);
          return this.view.$el.find('.lesson').first().hasClass('active-lesson').should.eq(true);
        });
        it('should activate a lesson when clicked upon', function() {
          var mediatorSpy;
          mediatorSpy = sinon.spy(mediator, 'trigger');
          $(this.view.$el.find('.lesson')[1]).click();
          mediatorSpy.called.should.be["true"];
          mediatorSpy.getCall(0).args[0].should.eq('lesson:navigate');
          mediatorSpy.getCall(0).args[1].should.eq(2);
          return mediatorSpy.restore();
        });
        describe('when it represents an inaccessible lesson', function() {
          it('should be disabled', function() {
            return this.view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be["true"];
          });
          return describe('and it becomes accessible', function() {
            return it('should be enabled', function() {
              this.view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be["true"];
              this.model.lessons.last().set({
                isAccessible: true
              });
              this.view.render();
              return this.view.$el.find('.lesson').last().hasClass('disabled-lesson').should.be["false"];
            });
          });
        });
        return describe('when it represents an accessible lesson', function() {
          return it('should be enabled', function() {
            return this.view.$el.find('.lesson').first().hasClass('disabled-lesson').should.be["false"];
          });
        });
      });
    });
  });

}).call(this);
