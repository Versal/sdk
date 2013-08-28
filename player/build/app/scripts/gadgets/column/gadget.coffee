define [
  'text!./template.html'
], (template) ->

  class Column
    className: 'column-gadget'

    constructor: (@facade, @properties, @$el) ->
      @facade.on 'toggleEdit', @onToggleEdit, @
      @facade.on 'configChange', @onConfigChange, @
      @facade.on 'domReady', @render, @

      @debouncedSave = _.debounce @save, 1000 # for now

      @childFacades = []

    onToggleEdit: (editable) ->

    onConfigChange: (@properties) ->

    render: ->
      @$el.html template

      @facade.trigger 'gadget:showChild',
        el: @$el.find('.first .payload'),
        name: 'first'
        success: @addFacade

      @facade.trigger 'gadget:showChild',
        el: @$el.find('.second .payload'),
        name: 'second'
        success: @addFacade

      @$el.find('.chooseChild').on 'click', @chooseChild
      @$el.find('.highlightChildren').on 'click', @highlightChildren

    chooseChild: (e) =>
      target = $(e.currentTarget)
      column = target.parent().data 'col'
      payload = target.siblings '.payload'

      @facade.trigger 'gadget:pickChild', {
        el: payload,
        name: column
        success: @addFacade
      }

    addFacade: (f) =>
      return if _.contains @childFacades, f

      @childFacades.push f

      f.on 'local:highlightParent', =>
        @$el.css background: 'lightblue'
        setTimeout =>
          @$el.css background: 'whitesmoke'
        , 500

    highlightChildren: =>
      _.each @childFacades, (f) -> f.trigger 'highlightSelf'

    save: ->
      @facade.trigger 'save', @properties

