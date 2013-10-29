define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/sidebar/author/gadget'
], (Helpers, Fixtures, SidebarGadgetView) ->

  view = model = null

  beforeEach ->

    model = new vs.api.GadgetProject
      username: 'foo'
      name: 'bar'
      version: '0.0.1'

    view = new SidebarGadgetView model: model

  describe 'Sidebar Gadget View', ->
    describe 'constructed icon paths', ->
      beforeEach ->
        vs.api.GadgetProject::apiUrl = "http://stack.versal.com/api2"

      it 'should be deterministic based on the URL', ->
        view.iconPath().should.eq "http://stack-1.versal.com/api2/gadgets/foo/bar/0.0.1/assets/icon.png"

      it 'should be different for different paths', ->

        # These magic numbers are the pre-verified sum of character codes in the URL, modulo 10.

        model.set username: 'baz'
        view.iconPath().should.eq "http://stack-4.versal.com/api2/gadgets/baz/bar/0.0.1/assets/icon.png"

        model.set username: 'bang'
        view.iconPath().should.eq "http://stack-5.versal.com/api2/gadgets/bang/bar/0.0.1/assets/icon.png"

    describe 'non-versal icon paths', ->
      it 'should not be numbered for different domains', ->
        vs.api.GadgetProject::apiUrl = "http://google.co"
        view.iconPath().should.eq "http://google.co/gadgets/foo/bar/0.0.1/assets/icon.png"

      it 'should not be numbered for different subdomains', ->

        vs.api.GadgetProject::apiUrl = "http://staging.versal.net"
        view.iconPath().should.eq "http://staging.versal.net/gadgets/foo/bar/0.0.1/assets/icon.png"
