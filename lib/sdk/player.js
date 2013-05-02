define(["cdn.underscore", "cdn.backbone", "text!sdk/toolbar.html"], function(_, Backbone, toolbarTemplate) {
  var Player = function() {
    this.facade = _.extend({}, Backbone.Events);
    this.toolbar = new Toolbar({ player: this });

    this.facade.on('all', this.debug);
  };

  Player.prototype.start = function() {
    this.toolbar.render();
    this.facade.trigger("render"); // DEPRECATE when we drop this in favor of domReady
    this.facade.trigger("domReady");
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

  var Toolbar = Backbone.View.extend({
    el: "#player-toolbar",
    template: _.template(toolbarTemplate),

    events: {
      "click .js-toggle-edit" : "toggleEdit",
    },

    initialize: function(options) {
      this.player = options.player;
    },

    toggleEdit: function(e){
      e.stopPropagation();
      var editable = e.currentTarget.value == "true";
      this.player.facade.trigger("toggleEdit", editable);
      if(editable) {
        $('body').one('click', function(){ $('#toggle-learner-mode').click() });
      }
    },

    render: function() {
      this.$el.html(this.template());
    }
  })

  return Player;
});
