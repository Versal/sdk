(function() {

  define(['app/mediator'], function(mediator) {
    var mixins;
    return mixins = {
      onLogoClick: function() {
        mediator.trigger('parent:notify', {
          event: 'logoClick'
        });
        return this.track('Click Logo');
      }
    };
  });

}).call(this);
