define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/sidebar/author/gadget'
], (Helpers, Fixtures, SidebarGadgetView) ->

  beforeEach ->
    @model = new vs.api.Gadget
    @view = new SidebarGadgetView model: @model

  describe 'Sidebar Gadget View', ->
