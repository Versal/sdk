define([], function(){
  var Gadget = function(options) {
    this.$el = options.$el;
    this.player = options.player;
    this.config = options.config;
    this.userState = options.userState;

    this.player.on('domReady', this.render, this);
  };

  Gadget.prototype.render = function(editable) {
    this.$el.html('<h1>Hello, world!</h1>');
  };

  return Gadget;
});
