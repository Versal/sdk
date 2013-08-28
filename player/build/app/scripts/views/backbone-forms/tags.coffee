define ['cdn.lodash', 'libs/backbone-forms', 'tags'], (_, Form, tags) ->

  class Form.editors.Tags extends Form.editors.Base

    width: 210

    tagName: 'input'

    initialize: (options) ->
      super(options)
      @tagboxValue = @value || []

    render: ->
      _.defer =>
        @renderTagbox()
      this

    renderTagbox: ->
      @tagboxOptions = @schema.options ? []

      @$el.tagbox
        url: @tagboxOptions
        lowercase: @schema.lowercase ? true
        duplicates: @schema.duplicates ? false
        minLength: @schema.minLength ? 1
        maxLength: @schema.maxLength ? 140

      @tagbox = @$el.data('tagbox')

      # we cannot pass these in as they become overwritten..
      onAdd = @tagbox.settings.onAdd
      @tagbox.settings.onAdd = =>
        onAdd()
        
        return if @updating
        @onChange()
        @updateTagboxOptions()

      onRemove = @tagbox.settings.onRemove
      @tagbox.settings.onRemove = =>
        onRemove()

        return if @updating
        @onChange()

      @updateTagbox()

    getValue: ->
      @tagboxValue = @tagbox.serialize().slice(0) if @tagbox?
      @tagboxValue || []

    setValue: (value) ->
      return unless _.isArray(value)
      return if _.isEqual(value, @tagboxValue)

      @tagboxValue = value
      @updateTagbox()

    updateTagbox: ->
      return unless @tagbox?

      @updating = true
      @clearValue()
      @tagbox.add "#{member}" for member in @tagboxValue
      @updating = false

      @updateTagboxOptions()

    clearValue: ->
      while @tagbox.serialize()?.length > 0
        @tagbox.remove 0

    onChange: ->
      @trigger 'change', this

    updateTagboxOptions: ->
      return unless @schema.updateAutoComplete

      @tagboxOptions.push member for member in _.difference(@tagbox.serialize(), @tagboxOptions)
