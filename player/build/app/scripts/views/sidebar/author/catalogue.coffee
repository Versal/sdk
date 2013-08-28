define [
  'app/mediator'
  'plugins/tracker'
  'cdn.marionette'
  'text!templates/author_sidebar/catalogue.html'
  './gadget'
  'app/catalogue'
  'plugins/backbone.filter'
], (mediator, tracker, Marionette, template, GadgetCard, gadgetCatalogue) ->

  includedInTypes = Backbone.Filter.extend
    defaults:
      field: 'type'
      types: []
    run: (collection) ->
      collection.select (model) =>
        @options.types.indexOf(model.get(@options.field)) >= 0

  class SidebarCatalogueView extends Marionette.CompositeView
    _.extend @::, tracker('Sidebar Catalogue')

    className: 'gadget-catalogue js-gadget-catalogue'
    template: _.template(template)
    itemView: GadgetCard
    itemViewContainer: '.js-gadgets'

    appendHtml: (cv, iv) ->
      return if iv.model.get('hidden')
      if (iv.model.get('catalog') == 'approved')
        cv.$('.approved').after iv.el
      else if (iv.model.get('catalog') == 'sandbox')
        cv.$('h3.approved, h3.sandbox').show()
        cv.$('.sandbox').after iv.el
      else if (iv.model.get('catalog') == 'pending')
        cv.$('h3.approved, h3.pending').show()
        cv.$('.pending').after iv.el

    ui:
      gadgetList: '.js-gadgets'

    events:
      'click .js-show-list-view': 'showListView'
      'click .js-show-tile-view': 'showTileView'

    initialize: (opts = {}) ->
      @catalogue = opts.catalogue || gadgetCatalogue
      @collection = new (@catalogue.constructor) @catalogue.models
      @listenTo @catalogue, 'reset', => @collection.reset @catalogue.models
      $(window).on 'resize', => @fixSizing()

    onRender: ->
      @on 'itemview:expand', @onItemViewExpanded, @
      @ui.gadgetList.sortable
        items: '.gadgetCard'
        connectWith: '.gadgets'
        delay: 100
        placeholder: 'hidden atom-placeholder'
        helper: 'clone' # FIXME: add toggle events to clone?
        receive: @onSortReceive
        start: @onSortStart
        stop: @onSortStop
        over: _.identity false

      _.defer => @fixSizing()

    changeView: (type) ->
      @$('.card-options i').addClass 'inactive'
      @$(".#{type}-view").removeClass 'inactive'
      @ui.gadgetList
        .fadeOut 100, =>
          @ui.gadgetList.removeClass('list-view tile-view')
            .addClass(type + '-view')
            .fadeIn 100

    showListView: ->
      @changeView 'list'
      @track 'Show List View'

    showTileView: (e) ->
      @changeView 'tile'
      @track 'Show Tile View'

    onItemViewExpanded: (itemView) ->
      _.each @children.without(itemView), (itemView) ->
        itemView.toggleExpansion false

    onSortStart: (e, ui) =>
      @track 'Start Dragging', { gadget: ui.helper.data('type') }
      ui.item.addClass('dragging')
      ui.item.removeClass('expanded').show()
      ui.helper.removeClass('expanded').show()
      ui.helper.addClass 'atom'
      ui.helper.css
        width: 1 # A nice number
        height: 'auto'
      .hide().fadeIn 200, ->
        ui.helper.addClass 'fullWidth'

    onSortReceive: (e, ui) =>
      false

    onSortStop: (e, ui) =>
      ui.item.removeClass('dragging')
      ui.item.removeAttr 'style'  # AKA "jquery ui sucks, make it suck less"
      false

    fixSizing: ->
      @ui.gadgetList.height document.documentElement.clientHeight - @ui.gadgetList.position().top - 20
