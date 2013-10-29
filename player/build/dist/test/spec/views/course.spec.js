(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/course', 'app/mediator'], function(Helpers, Fixtures, CourseView, mediator) {
    return describe('Course View', function() {
      beforeEach(function() {
        this.model = new vs.api.Course(Fixtures.Course());
        this.view = new CourseView({
          model: this.model
        });
        return this.fetchStub = sinon.stub(vs.api.Lesson.prototype, 'fetch', function() {
          var fetch;
          fetch = $.Deferred();
          fetch.abort = sinon.stub();
          fetch.resolve = sinon.stub();
          fetch.done = function(f) {
            return f();
          };
          return fetch;
        });
      });
      afterEach(function() {
        return this.fetchStub.restore();
      });
      describe('Initialization', function() {
        return it('should ensure at least one lesson exists', function() {
          this.model = new vs.api.Course(Fixtures.Course());
          this.model.lessons.reset([]);
          this.model.lessons.size().should.equal(0);
          this.view = new CourseView({
            model: this.model
          });
          return this.model.lessons.size().should.equal(1);
        });
      });
      describe('Rendering', function() {
        return it('should activate first lesson', function() {
          var firstLesson, spy;
          firstLesson = this.model.lessons.first();
          spy = sinon.spy(this.view, 'activateLesson');
          this.view.render();
          spy.calledWith(firstLesson).should.be["true"];
          return spy.restore();
        });
      });
      describe('Activating lessons', function() {
        beforeEach(function() {
          this.lesson = this.model.lessons.last();
          return this.view.render();
        });
        describe('when the lesson is not in the course', function() {
          return it('should fail', function() {
            var otherLesson;
            otherLesson = new vs.api.Lesson;
            return this.view.activateLesson(otherLesson).should.be["false"];
          });
        });
        describe('when the lesson is the active lesson', function() {
          return it('should fail', function() {
            this.view._activeLesson = this.lesson;
            return this.view.activateLesson(this.lesson).should.be["false"];
          });
        });
        it('should fetch the lesson', function() {
          this.view._activeLesson = null;
          this.view.activateLesson(this.lesson);
          return this.fetchStub.called.should.be["true"];
        });
        return it('should save the course progress', function() {
          var progressStub;
          progressStub = sinon.stub(vs.api.CourseProgress.prototype, 'save');
          this.view._activeLesson = null;
          this.view.activateLesson(this.lesson);
          progressStub.called.should.be["true"];
          return progressStub.restore();
        });
      });
      describe('Displaying lessons', function() {
        beforeEach(function() {
          return this.lesson = this.model.lessons.last();
        });
        it('should render the lesson view', function() {
          this.view.displayLesson(this.lesson);
          return this.view.lessonRegion.currentView.model.should.eq(this.lesson);
        });
        return it('updates the lesson title', function() {
          var spy;
          spy = sinon.spy(this.view, 'updateTitle');
          this.view.displayLesson(this.lesson);
          spy.called.should.be["true"];
          return spy.restore();
        });
      });
      describe('Clicking', function() {
        return describe('When a user clicks on the course', function() {
          it('should notify other views', function() {
            var name;
            sinon.stub(CourseView.prototype, 'isModalOpen', function() {
              return false;
            });
            sinon.stub(mediator, 'trigger');
            this.view.render();
            $('body').click();
            name = mediator.trigger.lastCall.args[0];
            name.should.eq('course:click');
            CourseView.prototype.isModalOpen.restore();
            return mediator.trigger.restore();
          });
          return describe('and a modal is open', function() {
            return it('should not notify other views', function() {
              var name;
              sinon.stub(CourseView.prototype, 'isModalOpen', function() {
                return true;
              });
              sinon.stub(mediator, 'trigger');
              this.view.render();
              $('body').click();
              name = mediator.trigger.lastCall.args[0];
              name.should.not.eq('course:click');
              CourseView.prototype.isModalOpen.restore();
              return mediator.trigger.restore();
            });
          });
        });
      });
      describe('Modal', function() {
        describe('when open', function() {
          return it('should be detectable', function() {
            this.view.render();
            $('body').append($('<div class="modal"></div>'));
            return this.view.isModalOpen().should.be["true"];
          });
        });
        return describe('when closed', function() {
          return it('should be detectable', function() {
            this.view.render();
            $('.modal').remove();
            return this.view.isModalOpen().should.be["false"];
          });
        });
      });
      return describe('Update Notification', function() {
        describe('when another author updates the course', function() {
          it('should display the notification banner', function() {
            sinon.stub(CourseView.prototype, 'showUpdateNotification');
            this.view = new CourseView({
              model: this.model
            });
            this.view.onCourseUpdate();
            CourseView.prototype.showUpdateNotification.called.should.be["true"];
            return CourseView.prototype.showUpdateNotification.restore();
          });
          return describe('multiple times', function() {
            return it('should display the notification banner with an update count', function() {
              sinon.spy(CourseView.prototype, 'showUpdateNotification');
              this.view = new CourseView({
                model: this.model
              });
              this.view.render();
              _.times(2, this.view.onCourseUpdate, this.view);
              CourseView.prototype.showUpdateNotification.called.should.be["true"];
              this.view.ui.updateNotificationMsg.text().should.contain('See 2 new updates');
              return CourseView.prototype.showUpdateNotification.restore();
            });
          });
        });
        return describe('when an update comes in while re-fetching course', function() {
          return it('should redisplay the notification banner', function() {
            sinon.spy(CourseView.prototype, 'showUpdateNotification');
            this.view = new CourseView({
              model: this.model
            });
            this.view.render();
            this.view.onCourseUpdate();
            this.view.onCourseRefetchSuccess();
            CourseView.prototype.showUpdateNotification.called.should.be["true"];
            return CourseView.prototype.showUpdateNotification.restore();
          });
        });
      });
    });
  });

}).call(this);
