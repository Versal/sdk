(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/sidebar/author/catalogue'], function(Helpers, Fixtures, CatalogueView) {
    return describe('Catalogue', function() {
      beforeEach(function() {
        return this.view = new CatalogueView({
          catalogue: new vs.api.GadgetProjects(Fixtures.Gadgets())
        });
      });
      return it('should show gadget group headers if given an unapproved gadget', function() {
        this.view.render();
        return (this.view.$el.find('.header.pending').css('display') === 'none').should.not.be["true"];
      });
    });
  });

}).call(this);
