define [
  'cdn.marionette'
  'app/mediator'
  'plugins/tracker'
  'views/gadget_instance'
  'views/inline_catalogue'
  'app/catalogue'
  'plugins/vs-sticky'
  'cdn.jqueryui'
], (Marionette, mediator, tracker, GadgetInstanceView, InlineCatalogueView, gadgetCatalogue, VsSticky) ->

  # This probably belongs in the gadget catalogue rather than
  # with the instances themselves
  _.extend vs.api.Gadget::,
    onResolveError: (error) ->
      console.error error
      @trigger 'resolve:error', error
    onResolveSuccess: (klass) ->
      @trigger 'resolve:success', klass,
        defaultConfig: @gadgetProject.get 'defaultConfig'
        defaultUserState: @gadgetProject.get 'defaultUserState'
        noToggleSwitch: @gadgetProject.get 'noToggleSwitch'
    resolve: (opts = {}) ->
      # remove and bind when this moves to API
      _.bindAll @, 'onResolveSuccess', 'onResolveError'

      return @onResolveError("Gadget Project not found: #{@get 'type'}") unless @gadgetProject

      if @gadgetProject.css()
        key = 'gadget-' + @gadgetProject.get 'id'
        mediator.trigger 'style:register', { key, href: _.result(@gadgetProject, 'css'), files: @gadgetProject.get('files') }

      # Player-defined gadgets have a constructor already attached.
      if klass = @gadgetProject.get 'classDefinition'
        @onResolveSuccess klass
      else
        require.config baseUrl: 'scripts'
        require [_.result @gadgetProject, 'main'], @onResolveSuccess, @onResolveError

  class Lesson extends Marionette.CollectionView
    _.extend @::, tracker('Lesson')

    initialize: (options = {}) ->
      @collection = @model.gadgets
      @catalogue = options.catalogue || gadgetCatalogue
      @activeView = null
      @embed = options.embed;
      @isEditable = options.isEditable

      @on 'itemview:edit', @onItemViewEdit, @
      @on 'itemview:doneEditing', @onItemViewDoneEditing, @
      @on 'itemview:userStateSync', => @trigger 'userStateSync'
      @listenTo @catalogue, 'ready', @onCatalogueReady, @

      # this ugliness for now
      $(window).click (e) =>
        # Blur if there's an atom being editing, and we clicked off it.
        if $('.gadget.editing').length and not $(e.target).parents('.gadget.editing, .modal').not('.noToggleEdit').length
          @activeView?.toggleEdit false
      $(window).on 'resize', => @fixSizing()

      mediator.on 'gadget:pickChild', @pickChild
      mediator.on 'gadget:showChild', @showChild

    remove: ->
      mediator.off 'gadget:pickChild', @pickChild
      mediator.off 'gadget:showChild', @showChild
      super

    className: 'gadgets'

    itemView: GadgetInstanceView
    itemViewOptions: =>
      'isEditable': @isEditable

    insertGadgetTypeAt: (type, index) ->
      if instance = @catalogue.buildInstanceOfType type
        instance.dropped = true
        instance.set { index: index  }
        @collection.create instance, { at: index }
        instance.resolve()
        @fixSizing()
        @track 'Add Gadget', { type: type, lesson: @model.id }
        return instance
      else
        console.error 'Failed grabbing gadget ' + type

    makeSortable: ->
      @$el.sortable
        handle: '.js-draggable'
        containment: 'parent'
        axis: 'y'
        forceHelperSize: true
        forcePlaceholderSize: true
        tolerance: 'pointer'
        over: @onSortOver
        receive: @onSortReceive
        start: @onSortStart
        stop: @onSortStop
        scrollSensitivity: 40

    resolveGadgets: ->
      # Ugly hack to resolve gadgets that already exist in the lesson
      @collection.each (instance) =>
        project = @catalogue.findGadgetByType instance.get 'type'
        instance.gadgetProject = project
        instance.resolve()

    onCatalogueReady: ->
      @resolveGadgets()

    onItemViewEdit: (activeView) ->
      @activeView?.toggleEdit false
      @activeView = activeView
      @trigger 'menuDeactivated', false
      # must toggleEdit before setting hoverables
      @children.each (itemView) ->
        itemView.showHoverables false unless itemView is activeView

    onItemViewDoneEditing: (activeView) ->
      @activeView = null
      @trigger 'menuDeactivated', true
      @children.each (itemView) -> itemView.showHoverables()

    onSortOver: (e, ui) =>
      ui.placeholder.animate
        height: ui.helper.height()

    onSortReceive: (e, ui) =>
      @insertGadgetTypeAt ui.item.data('type'), ui.item.index()

    onSortStart: (e, ui) =>
      ui.item.find('.fixed').removeClass 'fixed'
      ui.item.data 'originalPosition', ui.item.index()
      ui.placeholder.height ui.item.height() - 16
      ui.item.find('.toolbar').addClass "dragging"

    onSortStop: (e, ui) => _.defer =>
      oldIndex = ui.item.data('originalPosition')
      newIndex = ui.item.index()
      popped = @collection.at oldIndex
      @collection.move popped, newIndex
      ui.item.find('.toolbar').removeClass "dragging"
      @stickHeaders()
      @track 'Reorder Gadget', {
        gadget: popped.id,
        from: oldIndex,
        to: newIndex
      }

    onRender: ->
      @makeSortable()
      @resolveGadgets() if @catalogue.isReady()
      @navBarHeight = $('.courseHeader').height()
      @fixSizing()
      @removeOrphans()
      if @children.length == 0
        mediator.trigger 'gadget:rendered', null, true

      @track 'Render', { lesson: @model.id }

    removeOrphans: ->
      # Remove any "orphan" gadgets that are hidden and don't have a parent
      childGadgets = []
      @model.gadgets.each (gadget) =>
        if children = gadget.config.get '_children'
          childGadgets = childGadgets.concat _.values children

      @model.gadgets.each (gadget) =>
        return unless gadget
        if gadget.config.get('_hidden') && !_.contains(childGadgets, gadget.id)
          gadget.destroy { queue: true }

    fixSizing: ->
      _.defer => @$el.css
        "min-height": $(window).height() - $('.courseHeader').height() - 45

    appendHtml: (collectionView, itemView, index) ->
      if itemView.isChild()
        @onGadgetRendered itemView
        return false

      children = @$el.children()
      if children.size() <= index
        @$el.append itemView.el
      else
        children.eq(index).before(itemView.el)

      @fixSizing()
      itemView.on 'gadgetRendered', => @onGadgetRendered itemView

    onGadgetRendered: (itemView) ->
      itemView.rendered = true

      renderedAll = @children.every (i) -> i.rendered

      @stickHeaders() if renderedAll

      mediator.trigger 'gadget:rendered', itemView, renderedAll

    stickHeaders: -> _.defer =>
      unless @sticky
        @sticky = new VsSticky @$('.js-sticky-header'), @navBarHeight
        @sticky.listen()
      @sticky.setEls @$('.js-sticky-header')
      @sticky.updateEls()

    showHoverables: (bool = true) ->
      @children.each (itemView) -> itemView.showHoverables bool

    showGadget: (gadgetIndex) ->
      gadget = @children.findByIndex(gadgetIndex - 1)
      gadget.gadgetRendering.done =>
        _.defer => window.scrollTo 0, gadget.$el.offset().top - @navBarHeight

    pickChild: (options, source) =>
      { el, name, success, error } = options
      parent = @collection.get source.gadgetId

      onShown = (inlineCatalogue) =>
        inlineCatalogue.on 'selectGadget', (type) =>
          @addChildGadget parent, type, options

      onCancelled = =>
        return error? "Gadget selection canceled"

      mediator.trigger 'inlineCatalogue:show', el, onShown, onCancelled

    addChildGadget: (parent, type, { name, el, success }) =>
      gadget = @insertGadgetTypeAt type, @children.length

      gadget.once 'sync', =>
        gadget.config.save _hidden: true

        _children = parent.config.get('_children') || {}
        _children[name] = gadget.id

        parent.config.save { _children }

        facade = @children.findByModel(gadget)._facade
        success? facade

      @renderElsewhere gadget, el

    showChild: ({ el, name, success, error }, source) =>
      parent = @collection.get source.gadgetId

      _children = parent.config.get('_children') || {}
      id = _children[name]

      return error? "Child #{name} not found" unless id

      gadget = @collection.get id
      return error? "Gadget with ID #{id} not found" unless gadget
      @renderElsewhere gadget, el

      facade = @children.findByModel(gadget)._facade
      success? facade

    renderElsewhere: (gadget, destination) ->
      # TODO This probably violates Backbone philosophies. Rethink this.
      view = @children.findByModel gadget
      view.$el.remove()
      view.$el = destination
      view.render()

    isComplete: ->
      @model.gadgets.every (gadget) ->
        (gadget.get('type') != '6/quiz@1.0.04') ||
          (gadget.userState.get('results')?.pass == true)

    isEmbedded: -> @embed
