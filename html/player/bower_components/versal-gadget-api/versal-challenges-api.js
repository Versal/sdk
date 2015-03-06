window.VersalChallengesAPI = function(changeCallback) {
  this._handleMessage = this._handleMessage.bind(this);
  window.addEventListener('message', this._handleMessage);
  this._challenges = [];
  this._scoring = {};
  this._changeCallback = changeCallback || function(){};
};

window.VersalChallengesAPI.prototype.destroy = function() {
  window.removeEventListener('message', this._handleMessage);
};

window.VersalChallengesAPI.prototype.setChallenges = function(challenges) {
  if (!_.isArray(challenges)) throw new Error('challenges argument must be an array');

  this._challenges = challenges;
  this._callChangeCallback();
  window.parent.postMessage({event: 'setAttributes', data: {'vs-challenges': challenges}}, '*');
};

window.VersalChallengesAPI.prototype.scoreChallenges = function(responses) {
  if (!_.isArray(responses)) throw new Error('responses argument must be an array');
  if (responses.length !== this._challenges.length) throw new Error('responses argument must have same length as challenges');

  var scores = [];
  var totalScore = 0;
  for (var i=0; i<this._challenges.length; i++) {
    scores[i] = this._scoreChallenge(this._challenges[i], responses[i]);
    totalScore += scores[i];
  }

  this._scoring = {responses: responses, scores: scores, totalScore: totalScore};
  this._callChangeCallback();
  window.parent.postMessage({event: 'setLearnerState', data: {'vs-scores': this._scoring}}, '*');
};

window.VersalChallengesAPI.prototype._handleMessage = function(event) {
  var eventName = event.data.event;
  if(eventName) {
    var handler = this._messageHandlers[eventName];
    if(handler) {
      handler.call(this, event.data.data);
    }
  }
};

window.VersalChallengesAPI.prototype._callChangeCallback = function() {
  this._changeCallback({challenges: this._challenges, scoring: this._scoring});
};

window.VersalChallengesAPI.prototype._messageHandlers = {
  attributesChanged: function(attributes) {
    if (!_.isEqual(this._challenges, attributes['vs-challenges'])) {
      this._challenges = attributes['vs-challenges'] || [];
      this._callChangeCallback();
    }
  },

  learnerStateChanged: function(learnerState) {
    if (!_.isEqual(this._scoring, learnerState['vs-scores'])) {
      this._scoring = learnerState['vs-scores'] || {};
      this._callChangeCallback();
    }
  }
};

window.VersalChallengesAPI.prototype._scoreChallenge = function(challenge, response) {
  var scorer = this._scoringStrategies[challenge.scoring];
  if (!scorer) throw new Error('Unknown challenge scorer: ' + challenge.scoring);

  return scorer(challenge.answers, response);
};

window.VersalChallengesAPI.prototype._scoringStrategies = {
  strict: function(prompt, response) {
    // Coerce strings to guard against false negatives:
    // _.isEqual('2', 2) returns false
    return _.isEqual('' + prompt, '' + response) ? 1 : 0;
  },

  partial: function(prompt, response) {
    if (!_.isArray(prompt)) throw new Error('`prompt` argument must be an array for the `partial` scoring strategy)');
    if (!_.isArray(response)) throw new Error('`response` argument must be an array for the `partial` scoring strategy');
    if (prompt.length === 0) return 0;

    good = _.select(_.zip(prompt, response), function(zip){
      return _.isEqual(zip[0], zip[1]);
    });
    return good.length / prompt.length;
  },

  subset: function(prompt, response) {
    if (!_.isArray(prompt)) throw new Error('`prompt` argument must be an array for the `subset` scoring strategy)');
    if (!_.isArray(response)) throw new Error('`response` argument must be an array for the `subset` scoring strategy');
    if (prompt.length === 0) return 0;

    common = _.filter(response, function(responseAnswer) {
      return _.some(prompt, function(promptAnswer) {
        _.isEqual(responseAnswer, promptAnswer);
      });
    });

    return common.length / prompt.length;
  },

  range: function(prompt, response) {
    if (!_.isArray(prompt)) throw new Error('`prompt` argument must be an array for the `range` scoring strategy');
    if (prompt.length !== 2) throw new Error('`prompt` argument must be an array of two numbers for the `range` scoring strategy');
    if (!_.isNumber(response)) throw new Error('`response` argument must be a number for the `range` scoring strategy');

    var start = prompt[0];
    var end = prompt[1];

    return (start <= response && response <= end) ? 1 : 0;
  }
};
