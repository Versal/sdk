define(["underscore", "backbone", "text!sdk/toolbar.html"], function(_, Backbone, toolbarTemplate) {
  var Player = function() {
    this.facade = _.extend({}, Backbone.Events);
    this.toolbar = new Toolbar({ player: this });

    this.facade.on('all', this.debug);
  };

  Player.prototype.start = function() {
    this.toolbar.render();
    this.facade.trigger("render");
  };

  Player.prototype.debug = function() {
    if (!window.console) return;
    var args = _.toArray(arguments);
    var eventData = ['EVENT:', args.shift()];
    if (args.length) {
      eventData = eventData.concat('ARGUMENTS:', args)
    }
    console.debug.apply(console, eventData);
  };

  Player.prototype.loadFromDist = function() {
    require(["dist/gadget"], function(Gadget){ console.log(Gadget); });
  };

  var Toolbar = Backbone.View.extend({
    el: "#player-toolbar",
    template: _.template(toolbarTemplate),

    events: {
      "click .js-toggle-edit" : "toggleEdit",
      "click .js-load-from-dist" : "loadFromDist"
    },

    initialize: function(options) {
      this.player = options.player;
    },

    loadFromDist: function(e) {
      this.player.loadFromDist();
    },

    toggleEdit: function(e){
      var editable = e.currentTarget.value;
      this.player.facade.trigger("toggleEdit", editable === "true");
    },

    render: function() {
      this.$el.html(this.template());
    }
  })

  return Player;
});