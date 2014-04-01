(function() {
  define(['cdn.underscore', 'plugins/scoring_strategies'], function(_, strategies) {
    return function(challenges, responses) {
      if (!_.isArray(challenges)) {
        throw new Error('challenges argument must be an array');
      }
      if (!_.isArray(responses)) {
        throw new Error('responses argument must be an array');
      }
      return _.map(_.zip(challenges, responses), function(_arg) {
        var challenge, response, scorer;
        challenge = _arg[0], response = _arg[1];
        scorer = strategies[challenge.scoring];
        return scorer(challenge.answers, response);
      });
    };
  });

}).call(this);
