(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/sidebar/author/gadget'], function(Helpers, Fixtures, SidebarGadgetView) {
    beforeEach(function() {
      this.model = new vs.api.Gadget;
      return this.view = new SidebarGadgetView({
        model: this.model
      });
    });
    return describe('Sidebar Gadget View', function() {});
  });

}).call(this);
