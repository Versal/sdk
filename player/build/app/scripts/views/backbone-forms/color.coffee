define [
  'libs/backbone-forms'
  'modernizr'
  'libs/spectrum'
], (Form) ->

  class Form.editors.Color extends Form.editors.Base

    events:
      'change  input[type=color]': 'onColorChange'
      'change  input[type=text]': 'onTextChange'
      'keyup   input[type=text]': 'onTextChange'
      'keydown input[type=text]': 'onTextChange'
      focus:  'onFocus'
      blur:   'onBlur'

    onColorChange: () ->
      @setPickerColor @$colorInput().val()

    onTextChange: ->
      @color = @$textInput().val()
      @$colorInput().val @color
      @trigger 'change', @

    onFocus: ->
      @trigger 'focus', @
      # This call automatically sets `@hasFocus` to `true`.

    onBlur: ->
      @trigger 'blur', @
      # This call automatically sets `@hasFocus` to `false`.

    render: ->
      @$el.html  @$colorInput()
      # add polyfill for color picker
      unless Modernizr.inputtypes.color
        @$colorInput().spectrum
          color:@value,
          move: (color) => @setPickerColor("#"+color.toHex())
      @$el.append @$textInput()
      @setValue @value

      @

    setPickerColor: (@color) ->
      @$textInput().val @color
      @trigger 'change', @

    $colorInput: ->
      @_colorInput ?= $('<input class="input-color-color" type="color"></input>')

    $textInput: ->
      @_textInput ?= $('<input class="input-color-text" type="text"></input>')

    getValue: -> @color

    setValue: (color) ->
      @color = color
      @$colorInput().val @color
      @$textInput().val @color

    focus: ->
      @$colorInput().focus() unless @hasFocus

    blur: ->
      @$colorInput().blur() if @hasFocus

