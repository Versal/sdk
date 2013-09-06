define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/sidebar/author/catalogue'
], (Helpers, Fixtures, CatalogueView) ->

  describe 'Catalogue', ->
    beforeEach ->
      @view = new CatalogueView catalogue: new vs.api.GadgetProjects Fixtures.Gadgets()

    it 'should show gadget group headers if given an unapproved gadget', ->
      @view.render()
      (@view.$el.find('.header.pending').css('display') == 'none').should.not.be.true
