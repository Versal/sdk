(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'app/player', 'app/catalogue', 'plugins/vs.api'], function(Helpers, Fixtures, PlayerApplication, gadgetCatalogue) {
    var root;
    root = this;
    return describe('PlayerApplication', function() {
      beforeEach(function() {
        this.fetchGadgets = sinon.stub(gadgetCatalogue, 'fetchAll');
        return this.fetchLesson = sinon.stub(vs.api.Lesson.prototype, 'fetch', function() {
          return $.Deferred();
        });
      });
      afterEach(function() {
        this.fetchGadgets.restore();
        this.fetchLesson.restore();
        return Backbone.history.stop();
      });
      describe('Initializing', function() {
        describe('When a courseId is provided', function() {
          var courseId;
          courseId = 'some-course-uuid';
          beforeEach(function() {
            sinon.stub(PlayerApplication.prototype, 'loadCourse');
            return new PlayerApplication({
              api: {},
              courseId: courseId
            });
          });
          afterEach(function() {
            return PlayerApplication.prototype.loadCourse.restore();
          });
          return it('should load requested course', function() {
            return PlayerApplication.prototype.loadCourse.calledWith(courseId).should.be["true"];
          });
        });
        return describe('When no courseId is provided', function() {
          beforeEach(function() {
            sinon.spy(PlayerApplication.prototype, 'buildCourse');
            return new PlayerApplication({
              api: {}
            });
          });
          afterEach(function() {
            return PlayerApplication.prototype.buildCourse.restore();
          });
          return it('should load empty course', function() {
            return PlayerApplication.prototype.buildCourse.called.should.be["true"];
          });
        });
      });
      describe('.loadCourse', function() {
        var courseId;
        courseId = '42';
        beforeEach(function() {
          sinon.stub(vs.api.Course.prototype, 'fetch');
          this.player = new PlayerApplication({
            api: {}
          });
          return this.player.loadCourse(courseId);
        });
        afterEach(function() {
          Backbone.history.stop();
          return vs.api.Course.prototype.fetch.restore();
        });
        return it('should fetch the course model', function() {
          return vs.api.Course.prototype.fetch.called.should.be["true"];
        });
      });
      describe('.onCourseLoad', function() {
        beforeEach(function() {
          this.player = new PlayerApplication({
            api: {}
          });
          this.course = new vs.api.Course(Fixtures.Course(), {
            parse: true
          });
          sinon.spy(this.player.layout.sidebar, 'show');
          return sinon.stub(this.course, 'start');
        });
        afterEach(function() {
          this.player.layout.sidebar.show.restore();
          this.course.start.restore();
          $('.sidebar').html('');
          return Backbone.history.stop();
        });
        describe('when the course is editable and not embedded', function() {
          beforeEach(function() {
            this.player.options.embed = false;
            this.course.set({
              isEditable: true
            });
            return this.player.onCourseLoad(this.course);
          });
          it('should show a sidebar', function() {
            return this.player.layout.sidebar.show.called.should.be["true"];
          });
          return it('should show an author sidebar', function() {
            return this.player.layout.sidebar.$el.find('.authorSidebar').length.should.eq(1);
          });
        });
        describe('when the course is embedded', function() {
          beforeEach(function() {
            this.player.options.embed = true;
            this.course.set({
              isEditable: true
            });
            return this.player.onCourseLoad(this.course);
          });
          it('should show a sidebar', function() {
            return this.player.layout.sidebar.show.called.should.be["true"];
          });
          return it('should show a learner sidebar', function() {
            return this.player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq(1);
          });
        });
        describe('when the course is not editable and not embedded', function() {
          return beforeEach(function() {
            this.course.set({
              isEditable: false
            });
            this.player.onCourseLoad(this.course);
            it('should show a sidebar', function() {
              return this.player.layout.sidebar.show.called.should.be["true"];
            });
            return it('should show a learner sidebar', function() {
              return this.player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq(1);
            });
          });
        });
        describe('when the course has no position set', function() {
          beforeEach(function() {
            this.course.set({
              currentPosition: null
            });
            return this.player.onCourseLoad(this.course);
          });
          return it('should start it', function() {
            return this.course.start.called.should.be["true"];
          });
        });
        return describe('when the course has a position set', function() {
          beforeEach(function() {
            this.course.set({
              currentPosition: {
                currentLesson: 1
              }
            });
            return this.player.onCourseLoad(this.course);
          });
          return it('should not start it', function() {
            return this.course.start.called.should.be["false"];
          });
        });
      });
      return describe('registerStylesheet', function() {
        beforeEach(function() {
          return this.player = new PlayerApplication({
            api: {}
          });
        });
        return it('should create LINK tag in document head', function() {
          this.player.registerStylesheet({
            key: 'k1',
            url: 'some/file.css'
          });
          return $('link.k1').attr('href').should.eq('some/file.css');
        });
      });
    });
  });

}).call(this);
