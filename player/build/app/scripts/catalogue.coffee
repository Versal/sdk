define [
  'collections/gadget_catalogue'
  'gadgets/section/gadget'
  'gadgets/column/gadget'
  'gadgets/lipsum/gadget'
  'plugins/backbone.prioritize'
], (GadgetCatalogue, SectionGadget, ColumnGadget, LipsumGadget) ->

  localGadgets = new GadgetCatalogue [
    {
      author: "Versal"
      catalog: "approved"
      icon: "//s3-us-west-2.amazonaws.com/net.vrsl.stack.prod.static/player2/assets/img/authorSidebar/icon_header_gadget.png"
      classDefinition: SectionGadget
      id: "section"
      title: "Header"
      type: "gadget/section"
      version: "0.1.0"
      noToggleSwitch: true
    }
  ]

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
        # Reject invalid gadgets.
        # TODO remove this at the point P2 doesn't return invalid gadgets
        @add approved.reject (g) -> !g.isValid()
        @add unapproved.reject((g) -> !g.isValid())
        @add localGadgets.toJSON()

        _.each @models, (model) ->
          model.css ||= ''
          model.main ||= ''

        @trigger 'reset'
        @trigger 'sync'

  new CombinedCatalogue

