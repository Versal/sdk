(function() {

  define(['cdn.jquery'], function($) {
    var queue, save,
      _this = this;
    queue = [];
    save = _.throttle(function() {
      $.ajax({
        type: 'POST',
        url: '//stack.versal.com/stats/track',
        contentType: 'application/json',
        data: JSON.stringify(queue)
      });
      return queue = [];
    }, 20000);
    return function(category, action, data, eventType) {
      if (eventType == null) {
        eventType = 'counter';
      }
      queue.push({
        category: category,
        action: action,
        data: data,
        eventType: eventType
      });
      return save();
    };
  });

}).call(this);
