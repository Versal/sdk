define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/sidebar/author/author'
  'cdn.jquery'
], (Helpers, Fixtures, AuthorSidebarView, $) ->

  beforeEach ->
    @course = new vs.api.Course Fixtures.Course()
    @view = new AuthorSidebarView model: @course
    @view.render()

  describe 'Last Saved indicator', ->
    it 'should indicate if a course was saved just now', ->
      @view.lastSavedTime = +(new Date)
      @view.updateSavedLabel()
      @view.$('.timestamp').text().should.eq 'seconds'

    it 'should indicate if a course was saved recently', ->
      @view.lastSavedTime = +(new Date) - 45*1000
      @view.updateSavedLabel()
      @view.$('.timestamp').text().should.eq 'less than a minute'

    it 'should indicate if a course was saved several hours ago', ->
      @view.lastSavedTime = +(new Date) - 60*60*1000*4.1
      @view.updateSavedLabel()
      @view.$('.timestamp').text().should.eq '4 hours'

    it 'should update if a course is subsequently saved', (done) ->
      @view.lastSavedTime = +(new Date) - 60*60*1000
      @view.updateSavedLabel()
      $.ajax().success => # By default, loads the current page
        _.defer => # .success beats .ajaxSuccess in the call stack
          @view.$('.timestamp').text().should.eq 'seconds'
          done()

  describe 'Publish button', ->
    it 'should trigger a postMessage when clicked', ->
      postMessageStub = sinon.stub window, 'postMessage'
      @view.$el.find('.js-publish').click()
      postMessageStub.called.should.be.true
      postMessageStub.getCall(0).args[0].should.eq JSON.stringify { event: 'publishCourse' }
      postMessageStub.restore()

