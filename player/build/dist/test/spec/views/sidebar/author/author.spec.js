(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/sidebar/author/author', 'cdn.jquery'], function(Helpers, Fixtures, AuthorSidebarView, $) {
    beforeEach(function() {
      this.course = new vs.api.Course(Fixtures.Course());
      this.view = new AuthorSidebarView({
        model: this.course
      });
      return this.view.render();
    });
    describe('Last Saved indicator', function() {
      it('should indicate if a course was saved just now', function() {
        this.view.lastSavedTime = +(new Date);
        this.view.updateSavedLabel();
        return this.view.$('.timestamp').text().should.eq('seconds');
      });
      it('should indicate if a course was saved recently', function() {
        this.view.lastSavedTime = +(new Date) - 45 * 1000;
        this.view.updateSavedLabel();
        return this.view.$('.timestamp').text().should.eq('less than a minute');
      });
      it('should indicate if a course was saved several hours ago', function() {
        this.view.lastSavedTime = +(new Date) - 60 * 60 * 1000 * 4.1;
        this.view.updateSavedLabel();
        return this.view.$('.timestamp').text().should.eq('4 hours');
      });
      return it('should update if a course is subsequently saved', function(done) {
        var _this = this;
        this.view.lastSavedTime = +(new Date) - 60 * 60 * 1000;
        this.view.updateSavedLabel();
        return $.ajax().success(function() {
          return _.defer(function() {
            _this.view.$('.timestamp').text().should.eq('seconds');
            return done();
          });
        });
      });
    });
    return describe('Publish button', function() {
      return it('should trigger a postMessage when clicked', function() {
        var postMessageStub;
        postMessageStub = sinon.stub(window, 'postMessage');
        this.view.$el.find('.js-publish').click();
        postMessageStub.called.should.be["true"];
        postMessageStub.getCall(0).args[0].should.eq(JSON.stringify({
          event: 'publishCourse'
        }));
        return postMessageStub.restore();
      });
    });
  });

}).call(this);
