define [
  'cdn.lodash',
  'cdn.jquery'
], (_, $) ->
  class VsSticky
    constructor: (@els, @offset = 0, @interval = 10) ->
      @updateEls @els

      # Inject stuck styling into document.
      $("<style>.vs-sticky-stuck{top:#{@offset}px;}</style>").appendTo('head')

      @topEl = @els.get 0
      @scroll()

    setEls: (@els) ->
      @topEl = @els.get 0

    updateEls: () ->
      @els.addClass 'vs-sticky'
      @teardown()
      @els.each ->
        $(@).data
          start: $(@).offset().top
          height: $(@).outerHeight()
      @scroll()

    listen: ->
      $(window).on 'scroll', =>
        _.throttle @scroll, @interval
        _.throttle @updateEls(), 1000

    stopListening: ->
      $(window).off('scroll')

    teardown: ->
      @els.removeClass 'vs-sticky-stuck'
      @els.removeAttr 'style'

    scroll: =>
      cutoff = $(window).scrollTop() + @offset #y-position of top of lesson
      @teardown()
      height = $(@topEl).data 'height' #height of sticky header element
      start = $(@topEl).data 'start' #y-position of sticky header on page

      if start > cutoff
        unless @topEl == @els.get 0
          # scrolled upwards, so we need to change the topEl and recall @scroll
          i = 1
          while $(@els[i]).data("start") < cutoff
            i++
          @topEl = @els[i-1]
          @scroll()
          return

      $(@topEl).unwrap() if $(@topEl).parent().hasClass 'wrapper'

      if start <= cutoff
        # Create a wrapper to act as a "placeholder" for the original header
        wrapper = $('<div>').addClass 'wrapper'
        wrapper.height height
        wrapper.css 'margin-bottom': $(@topEl).css 'margin-bottom'
        $(@topEl).wrap wrapper

        $(@topEl).addClass 'vs-sticky-stuck'

        nextEl = @els.get(1 + @els.index(@topEl))

        return unless nextEl

        distanceToNext = $(nextEl).data('start') - cutoff

        if distanceToNext <= height
          $(@topEl).css 'top', (@offset + distanceToNext - height) + 'px'
          if distanceToNext < 1
            @topEl = nextEl

