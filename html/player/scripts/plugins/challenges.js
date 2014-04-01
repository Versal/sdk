(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.underscore', 'models/json_asset', 'plugins/scoring', 'plugins/vs.api', 'plugins/sum_array'], function(_, JsonAsset, scoring, api, sumArray) {
    var Challenges;
    return Challenges = (function() {
      Challenges.prototype.defaultScores = {
        scores: [],
        totalScore: 0,
        responses: []
      };

      function Challenges(model, launcher) {
        this.model = model;
        this.launcher = launcher;
        this._onChallengesSaveSuccess = __bind(this._onChallengesSaveSuccess, this);
        this._onSetChallenges = __bind(this._onSetChallenges, this);
        this._sendScores = __bind(this._sendScores, this);
        this._onScoreChallenges = __bind(this._onScoreChallenges, this);
        this._onChallengesFetchSuccess = __bind(this._onChallengesFetchSuccess, this);
        this._challenges = [];
        this._loadChallenges();
        this.launcher.once('detach', this._destroy);
        this.launcher.on('setChallenges', this._onSetChallenges);
        this.launcher.on('scoreChallenges', this._onScoreChallenges);
      }

      Challenges.prototype._loadChallenges = function() {
        var challengesConfig;
        challengesConfig = this.model.config.get('__versal_challenges');
        this.bankId = challengesConfig != null ? challengesConfig.bankId : void 0;
        if (this.bankId) {
          this._fetchChallenges(this.bankId);
        } else {
          this._sendChallenges();
        }
        return this._sendScores();
      };

      Challenges.prototype._sendChallenges = function() {
        return this.launcher.trigger('challengesChanged', {
          challenges: this._challenges
        });
      };

      Challenges.prototype._fetchChallenges = function() {
        var challenges;
        challenges = new JsonAsset({
          bankId: this.bankId
        });
        return challenges.fetch({
          success: this._onChallengesFetchSuccess,
          error: function() {}
        });
      };

      Challenges.prototype._onChallengesFetchSuccess = function(challenges) {
        this._challenges = challenges.get('resources');
        return this._sendChallenges();
      };

      Challenges.prototype._destroy = function() {
        this.launcher.off('setChallenges', this._onSetChallenges);
        return this.launcher.off('scoreChallenges', this._onScoreChallenges);
      };

      Challenges.prototype._onScoreChallenges = function(responses) {
        var scores, totalScore;
        scores = scoring(this._challenges, responses);
        totalScore = sumArray(scores);
        return this._saveAndSendScores({
          responses: responses,
          scores: scores,
          totalScore: totalScore
        });
      };

      Challenges.prototype._sendScores = function() {
        return this.launcher.trigger('scoresChanged', this._currentScores());
      };

      Challenges.prototype._currentScores = function() {
        var userState;
        userState = this.model.userState.get('__versal_challenges');
        return (userState != null ? userState.currentScores : void 0) || _.clone(this.defaultScores);
      };

      Challenges.prototype._saveAndSendScores = function(currentScores) {
        var attributes;
        attributes = {
          __versal_challenges: {
            currentScores: currentScores
          }
        };
        return this.model.userState.save(attributes, {
          success: this._sendScores,
          error: function() {}
        });
      };

      Challenges.prototype._onSetChallenges = function(_challenges) {
        var asset, attributes;
        this._challenges = _challenges;
        attributes = {
          title: 'challenge bank',
          content: JSON.stringify({
            resources: this._challenges
          }),
          contentType: 'application/json'
        };
        asset = new api.Asset;
        return asset.save(attributes, {
          upload: true,
          success: this._onChallengesSaveSuccess,
          error: function() {}
        });
      };

      Challenges.prototype._onChallengesSaveSuccess = function(asset) {
        var attributes,
          _this = this;
        this.bankId = asset.representations.first().get('id');
        attributes = {
          __versal_challenges: {
            bankId: this.bankId
          }
        };
        return this.model.config.save(attributes, {
          success: function() {
            return _this.launcher.trigger('challengesChanged', {
              challenges: _this._challenges
            });
          },
          error: function() {}
        });
      };

      return Challenges;

    })();
  });

}).call(this);
