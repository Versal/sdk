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
      return describe('Displaying lessons', function() {
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
    });
  });

}).call(this);
