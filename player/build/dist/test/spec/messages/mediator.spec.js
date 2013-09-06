(function() {

  define(['messages/mediator'], function(Mediator) {
    return describe('Mediator', function() {
      beforeEach(function() {
        this.data = {
          content: 'foobar'
        };
        this.mediator = new Mediator;
        return this.handler = sinon.spy();
      });
      it('subscribes and triggers', function() {
        this.mediator.on('channel', this.handler);
        this.mediator.trigger('channel', this.data);
        return this.handler.calledWith(this.data).should.be["true"];
      });
      return it('handles off', function() {
        this.mediator.on('channel', this.handler);
        this.mediator.off('channel', this.handler);
        this.mediator.trigger('channel', this.data);
        return this.handler.called.should.be["false"];
      });
    });
  });

}).call(this);
