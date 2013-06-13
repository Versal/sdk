define(["scripts/random", "cdn.jquery", "cdn.backbone"], function(random, $, Backbone){

  var Gadget = function(player, config, $el) {
    this.$el = $el;
    this.editable = false;

    this.update(config);

    player.on('toggleEdit', this.toggleEdit, this);
    player.on('configChange', this.update, this);
    player.on('render', this.render, this);
  };

  Gadget.prototype.update = function(config) {
    this.username = config.username;
    this.foo = random();
  };

  Gadget.prototype.render = function() {
    if(this.editable) {
      this.$el.html('<h1>' + this.foo + ' is your lucky number, ' + this.username + '!</h1><button type="button">OK, thanks!</button>');
    } else {
      this.$el.html('<h1>' + this.foo + ' is your lucky number, ' + this.username + '!</h1>');
    }
  };

  Gadget.prototype.toggleEdit = function(editable) {
    this.editable = editable;
    this.render();
  };

  return Gadget;
});
