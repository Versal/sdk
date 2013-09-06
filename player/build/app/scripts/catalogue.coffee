define [
  'collections/gadget_catalogue'
  'gadgets/section/gadget'
  'gadgets/column/gadget'
  'gadgets/lipsum/gadget'
  'plugins/backbone.prioritize'
], (GadgetCatalogue, SectionGadget, ColumnGadget, LipsumGadget) ->

  # TODO: Deprecate this when player#841 is complete
  localSection = new vs.api.GadgetProject
    author: "Versal"
    catalog: "approved"
    icon: "//s3-us-west-2.amazonaws.com/net.vrsl.stack.prod.static/player2/assets/img/authorSidebar/icon_header_gadget.png"
    classDefinition: SectionGadget
    id: "section"
    title: "Header"
    username: "versal"
    name: "section"
    version: "0.2.9"
    noToggleSwitch: true
    noCss: true

  class CombinedCatalogue extends GadgetCatalogue
    fetchAll: (opts = {}) ->
      approved = new GadgetCatalogue
      unapproved = new GadgetCatalogue
      $.when(approved.fetchApproved(), unapproved.fetchUnapproved()).then =>
        approved.prioritize [
          { title: 'Header' }
          { title: 'Text' }
          { title: 'Image', type: '6/image@0.7.3' }
          { title: 'Video' }
          { title: 'Quiz' }
          { title: 'Survey' }
          { title: 'Expression' }
          { title: 'Data viewer' }
          { title: 'References' }
          { title: 'Map' }
          { title: 'Markdown' }
          { title: 'Image annotator' }
          { title: 'Image detail' }
          { title: 'Color bar' }
          { title: 'R0' }
          { title: '3D anatomy' }
          { title: 'Cellular automaton' }
          { title: 'Principle of superposition' }
        ]

        @add approved.models
        @add unapproved.models

        # TODO: Deprecate this when player#841 is complete
        unless @find((g) -> g.type() == 'versal/section@0.2.9')
          @add localSection

        @trigger 'reset'
        @trigger 'sync'

  new CombinedCatalogue

