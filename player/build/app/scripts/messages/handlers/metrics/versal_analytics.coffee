define ['cdn.jquery'], ($) ->
  queue = []

  save = _.throttle =>
    $.ajax
      type: 'POST',
      url: '//stack.versal.com/stats/track'
      contentType: 'application/json'
      data: JSON.stringify queue

    queue = []
  , 20000

  (category, action, data, eventType='counter') ->
    queue.push { category, action, data, eventType }
    save()
