define ['cdn.jquery', 'libs/backbone-forms', 'clayer'], ($, Form, clayer) ->

  class Form.editors.Range extends Form.editors.Base

    width: 210

    initialize: (options) ->
      super(options)
      @min = @schema.min || 0
      @max = @schema.max || 100
      @step = @schema.step || 1

    render: ->
      @$el.width(@width)
      range = (@max - @min) / @step + 1
      @slider = new clayer.Slider @$el, this, @width/range, disableHover: true

      @$knob = $('<div class="clayer-slider-knob-value"></div>');
      @$('.clayer-slider-knob').append(@$knob);

      @setValue @value || 0
      this

    sliderChanged: (value) ->
      #Find decimal places in @step
      decs = @_decimalPlaces()
      #Find value number, trim to correct decimal place
      val = Number((value * @step + @min).toFixed(decs))

      #Make sure that min <= value <= max
      @sliderValue = @_clamp(val)

      @updateKnob()
      @trigger 'change', this

    _decimalPlaces: ->
      decimals = ('' + @step).split('.')[1] || ''
      decimals.length

    _clamp: (val) ->
      Math.min @max, Math.max(@min, val)

    getValue: -> @sliderValue

    setValue: (value) ->
      @sliderValue = value
      @slider.setValue (value-@min) / @step
      @updateKnob()

    updateKnob: ->
      @$knob.text @sliderValue

    focus: ->
      return if @hasFocus

    blur: ->
      return unless @hasFocus
