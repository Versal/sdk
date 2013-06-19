define(["scripts/random", "cdn.jquery"], function(random, $){

  var Gadget = function(options) {
    this.$el = options.$el;
    this.player = options.player;
    this.config = options.config;

    options.propertySheetSchema.set('username', 'Text')

    this.update(options.config);

    this.player.on('toggleEdit', this.toggleEdit, this);
    this.config.on('change:username', this.update, this);
    this.player.on('onReady', this.render, this);
  };

  Gadget.prototype.update = function() {
    this.username = this.config.get('username');
    this.foo = random();
    this.render();
  };

  Gadget.prototype.render = function(editable) {
    if (editable) {
      this.$el.html('<h1>' + this.foo + ' is your lucky number, ' + this.username + '!</h1><button type="button">OK, thanks!</button>');
    } else {
      this.$el.html('<h1>' + this.foo + ' is your lucky number, ' + this.username + '!</h1>');
    }
  };

  Gadget.prototype.toggleEdit = function(editable) {
    this.render(editable);
  };

  return Gadget;
});
