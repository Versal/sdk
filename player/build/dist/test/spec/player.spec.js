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
          return it('should load requested course', function() {
            var courseId, stub;
            courseId = 'some-course-uuid';
            stub = sinon.stub(PlayerApplication.prototype, 'loadCourse');
            new PlayerApplication({
              api: {},
              courseId: courseId
            });
            stub.calledWith(courseId).should.be["true"];
            return stub.restore();
          });
        });
        return describe('When no courseId is provided', function() {
          return it('should load empty course', function() {
            var loadSpy;
            loadSpy = sinon.spy(PlayerApplication.prototype, 'buildCourse');
            new PlayerApplication({
              api: {}
            });
            loadSpy.called.should.be["true"];
            return loadSpy.restore();
          });
        });
      });
      describe('.loadCourse', function() {
        beforeEach(function() {
          return this.player = new PlayerApplication({
            api: {}
          });
        });
        afterEach(function() {
          return Backbone.history.stop();
        });
        return it('should fetch the course model', function() {
          var courseId, fetchStub;
          courseId = 42;
          fetchStub = sinon.stub(vs.api.Course.prototype, 'fetch');
          this.player.loadCourse(courseId);
          fetchStub.called.should.be["true"];
          return fetchStub.restore();
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
          return this.showSpy = sinon.spy(this.player.layout.sidebar, 'show');
        });
        afterEach(function() {
          this.showSpy.restore();
          $('.sidebar').html('');
          return Backbone.history.stop();
        });
        it('should show the author sidebar in the left rail if the course is editable and not embedded', function() {
          this.player.options.embed = false;
          this.course.set({
            isEditable: true
          });
          this.player.onCourseLoad(this.course);
          this.showSpy.called.should.be["true"];
          return this.player.layout.sidebar.$el.find('.authorSidebar').length.should.eq(1);
        });
        it('should not show the author sidebar in the left rail if the course is embedded', function() {
          this.player.options.embed = true;
          this.course.set({
            isEditable: true
          });
          this.player.onCourseLoad(this.course);
          this.showSpy.called.should.be["true"];
          return this.player.layout.sidebar.$el.find('.authorSidebar').length.should.eq(0);
        });
        return it('should show the learner sidebar if the course is not editable', function() {
          this.course.set({
            isEditable: false
          });
          this.player.onCourseLoad(this.course);
          this.showSpy.called.should.be["true"];
          return this.player.layout.sidebar.$el.find('.learnerSidebar').length.should.eq(1);
        });
      });
      return describe('registerStylesheet', function() {
        beforeEach(function() {
          return this.player = new PlayerApplication({
            api: {}
          });
        });
        return it('should create LINK tag in document head', function(done) {
          var links;
          links = document.head.getElementsByTagName('link').length;
          return this.player.registerStylesheet('some/file.css', function() {
            document.head.getElementsByTagName('link').length.should.equal(links + 1);
            return done();
          });
        });
      });
    });
  });

}).call(this);
