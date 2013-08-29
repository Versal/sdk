define ['app/mediator'], (mediator) ->
  options = {}
  mixin = (category) ->
    {
      _activeTimers: {}

      trackerSetup: (opts) ->
        options = opts

      track: (action, data = {}) ->
        mediator.trigger 'metric:record', category, action, _.extend({}, options, data)

      startTimer: (name) ->
        @_activeTimers[name] = (new Date).getTime()
        return { end: => @endTimer name }

      endTimer: (name, data = {}) ->
        return false unless timer = @_activeTimers[name]
        currentTime = (new Date).getTime()
        info =
          start: timer
          end: currentTime
          length: currentTime - timer
        mediator.trigger 'metric:record', category, name, _.extend({}, options, data, info), 'timer'
        delete @_activeTimers[name]
    }
