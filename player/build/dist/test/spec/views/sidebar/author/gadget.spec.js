(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/sidebar/author/gadget'], function(Helpers, Fixtures, SidebarGadgetView) {
    var model, view;
    view = model = null;
    beforeEach(function() {
      model = new vs.api.GadgetProject({
        username: 'foo',
        name: 'bar',
        version: '0.0.1'
      });
      return view = new SidebarGadgetView({
        model: model
      });
    });
    return describe('Sidebar Gadget View', function() {
      describe('constructed icon paths', function() {
        beforeEach(function() {
          return vs.api.GadgetProject.prototype.apiUrl = "http://stack.versal.com/api2";
        });
        it('should be deterministic based on the URL', function() {
          return view.iconPath().should.eq("http://stack-1.versal.com/api2/gadgets/foo/bar/0.0.1/assets/icon.png");
        });
        return it('should be different for different paths', function() {
          model.set({
            username: 'baz'
          });
          view.iconPath().should.eq("http://stack-4.versal.com/api2/gadgets/baz/bar/0.0.1/assets/icon.png");
          model.set({
            username: 'bang'
          });
          return view.iconPath().should.eq("http://stack-5.versal.com/api2/gadgets/bang/bar/0.0.1/assets/icon.png");
        });
      });
      return describe('non-versal icon paths', function() {
        it('should not be numbered for different domains', function() {
          vs.api.GadgetProject.prototype.apiUrl = "http://google.co";
          return view.iconPath().should.eq("http://google.co/gadgets/foo/bar/0.0.1/assets/icon.png");
        });
        return it('should not be numbered for different subdomains', function() {
          vs.api.GadgetProject.prototype.apiUrl = "http://staging.versal.net";
          return view.iconPath().should.eq("http://staging.versal.net/gadgets/foo/bar/0.0.1/assets/icon.png");
        });
      });
    });
  });

}).call(this);
