define ['text!./template.html'], (template) ->

  class SectionHeader
    className: 'section-header'

    constructor: (options) ->
      @player = options.player
      @config = options.config
      @$el = $(options.el)
      @player.on 'toggleEdit', @toggleEdit, @
      @player.on 'domReady', @render, @

    render: ->
      @$el.html template
      @$el.addClass @className
      @text = new vs.ui.EditableText
        el: @$el.find('.section-content')
        type: 'input'
        success: => @save()

      content = @config.get('content')
      if content
        @text.setText content
      else
        @$el.hide()

    toggleEdit: (editable, options) ->
      @$el.show()
      @text.toggleEdit editable, false
      @$el.find('.section-content').focus() unless options.onLoad

    save: ->
      @config.save('content', @text.getPretty())

