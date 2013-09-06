define [
  'cdn.marionette'
  'text!templates/author_sidebar/sidebar_gadget.html'
], (Marionette, template) ->

  class SidebarGadget extends Marionette.ItemView
    template: _.template template
    className: 'gadgetCard js-gadgetCard'

    events:
      'click' : 'onClick'

    initialize: ->
      # FIXME: There should be no need in this check, since all gadget projects
      # must expose type. Currently, some tests are failing without this check.
      if _.isFunction @model.type then @$el.attr 'data-type', @model.type()
      @model.set
        title: @model.get('title') || @model.get('name')
      , silent: true

    attributes: ->
      { 'data-gadget-id': @model.id }

    ui:
      icon: '.icon'
      title: '.title'

    onRender: ->
      # TODO: Deprecate this when player#841 is complete
      if @model.type() == 'versal/section@0.2.9'
        @ui.icon.css "background-image", "url(#{@model.get('icon')})"
      else
        @ui.icon.css "background-image", "url(#{@model.icon()})"

    onClick: (e) ->
      e.preventDefault()
      @toggleExpansion()

    toggleExpansion: (force) ->
      @$el.toggleClass 'expanded', force
      @trigger 'expand', @ if @$el.hasClass 'expanded'
