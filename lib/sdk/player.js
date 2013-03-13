define(["underscore", "backbone"], function(_, Backbone) {
  var Player = function() {
    this.facade = _.extend({}, Backbone.Events);
  };

  Player.prototype.start = function() {
    this.facade.trigger("render");
  }

  return Player;
});