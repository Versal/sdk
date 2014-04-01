(function() {
  define(['plugins/deep_intersection', 'cdn.underscore'], function(deepIntersection, _) {
    var strategies;
    return strategies = {
      strict: function(prompt, response) {
        var isStrict;
        isStrict = _.isEqual(prompt, response);
        if (isStrict) {
          return 1;
        } else {
          return 0;
        }
      },
      partial: function(prompt, response) {
        var good;
        if (!_.isArray(prompt)) {
          throw new Error('`prompt` argument must be an array for the `partial` scoring strategy)');
        }
        if (!_.isArray(response)) {
          throw new Error('`response` argument must be an array for the `partial` scoring strategy');
        }
        good = _.select(_.zip(prompt, response), function(_arg) {
          var _prompt, _response;
          _prompt = _arg[0], _response = _arg[1];
          return _.isEqual(_prompt, _response);
        });
        if (!prompt.length) {
          return 0;
        }
        return good.length / prompt.length;
      },
      subset: function(prompt, response) {
        var common;
        if (!_.isArray(prompt)) {
          throw new Error('`prompt` argument must be an array for the `subset` scoring strategy');
        }
        if (!_.isArray(response)) {
          throw new Error('`response` argument must be an array for the `subset` scoring strategy');
        }
        common = deepIntersection(prompt, response);
        if (!prompt.length) {
          return 0;
        }
        return common.length / prompt.length;
      },
      range: function(prompt, response) {
        var end, start;
        if (!_.isArray(prompt)) {
          throw new Error('`prompt` argument must be an array for the `range` scoring strategy');
        }
        if (prompt.length !== 2) {
          throw new Error('`prompt` argument must be an array of two numbers for the `range` scoring strategy');
        }
        if (!_.isNumber(response)) {
          throw new Error('`response` argument must be a number for the `range` scoring strategy');
        }
        start = prompt[0], end = prompt[1];
        if ((start <= response && response <= end)) {
          return 1;
        } else {
          return 0;
        }
      }
    };
  });

}).call(this);
