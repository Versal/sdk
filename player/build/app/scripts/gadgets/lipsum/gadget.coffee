define [
  'text!./template.html'
], (template) ->

  class Lipsum
    className: 'lipsum-gadget'

    constructor: (@facade, @properties, @$el) ->
      @facade.on 'domReady', @render, @
      @facade.on 'local:highlightSelf', @highlightSelf, @

    render: ->
      @$el.html template
      @$el.find('.highlightParent').on 'click', => @facade.trigger 'highlightParent'

    highlightSelf: ->
      @$el.css background: 'lightgreen'
      setTimeout =>
        @$el.css background: 'whitesmoke'
      , 500
