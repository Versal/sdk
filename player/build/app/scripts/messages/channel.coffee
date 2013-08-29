define [], ->

  class Channel

    constructor: ->
      @_subscribers = []
      @channels = {}

    on: (callback, context = @) ->
      subscriber = context: context, callback: callback
      @_subscribers.push subscriber

    off: (callback, context = null) ->
      for i in [@_subscribers.length - 1..0] by -1
        sub = @_subscribers[i]
        if !callback
          @_subscribers.splice i, 1
        else if sub.callback == callback
          if !context? || sub.context == context
            @_subscribers.splice i, 1

    trigger: (data...) ->
      for sub in @_subscribers
        sub.callback.apply sub.context, data

