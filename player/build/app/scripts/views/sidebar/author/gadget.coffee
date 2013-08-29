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
      @$el.attr 'data-type', @model.get('type')
      @model.set
        title: @model.get('title') || @model.get('name')
      , silent: true

    attributes: ->
      { 'data-gadget-id': @model.id }

    ui:
      icon: '.icon'
      title: '.title'

    onRender: ->
      if @model.has 'icon'
        @ui.icon.css "background-image", "url(#{@model.get('icon')})"

    onClick: (e) ->
      e.preventDefault()
      @toggleExpansion()

    toggleExpansion: (force) ->
      @$el.toggleClass 'expanded', force
      @trigger 'expand', @ if @$el.hasClass 'expanded'
