(function() {

  define(['app/mediator'], function(Mediator) {
    return describe('Events', function() {
      beforeEach(function() {
        return this.mediator = Events;
      });
      return describe('When an event is received', function() {
        beforeEach(function() {
          return this.payload = {
            foo: 'bar'
          };
        });
        it('should be passed to handler', function() {});
        return it('should work', function() {});
      });
    });
  });

}).call(this);
