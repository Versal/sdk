define [
  'cdn.marionette'
  'text!templates/inline_catalogue_item.html'
  'text!templates/inline_catalogue.html'
  'app/catalogue'
  'app/mediator'
], (Marionette, itemTemplate, template, gadgetCatalogue, mediator) ->
  class InlineCatalogueItem extends Marionette.ItemView
    tagName: 'li'

    template: _.template itemTemplate

    events:
      click: 'select'

    select: -> @trigger 'select'

  class InlineCatalogueView extends Marionette.CompositeView
    className: 'inlineCatalogue'

    itemView: InlineCatalogueItem

    itemViewContainer: '.items'

    initialize: ->
      @collection = gadgetCatalogue
      @on 'itemview:select', @createInstance

    events: ->
      'click .cancel': 'onCancelClick'

    onCancelClick: -> @trigger 'selectCanceled'

    createInstance: (view) -> @trigger 'selectGadget', view.model.get('type')

    template: -> _.template template
