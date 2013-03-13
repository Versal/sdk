define(["underscore", "backbone", "text!sdk/toolbar.html"], function(_, Backbone, toolbarTemplate) {
  var Player = function() {
    this.facade = _.extend({}, Backbone.Events);
    this.toolbar = new Toolbar({ player: this });
  };

  Player.prototype.start = function() {
    this.toolbar.render();
    this.facade.trigger("render");
  }

  var Toolbar = Backbone.View.extend({
    el: "#player-toolbar",
    template: _.template(toolbarTemplate),

    events: {
      "click .js-toggle-edit" : "toggleEdit"
    },

    initialize: function(options) {
      this.player = options.player;
    },

    toggleEdit: function(e){
      var editable = e.currentTarget.value;
      console.log(editable);
      this.player.facade.trigger("toggleEdit", editable);
    },

    render: function() {
      this.$el.html(this.template());
    }
  })

  return Player;
});