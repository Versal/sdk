(function() {

  define(['messages/channel'], function(Channel) {
    return describe('Channel', function() {
      beforeEach(function() {
        return this.channel = new Channel;
      });
      it('has subscribers');
      it('has subchannels');
      describe('Subscribing', function() {
        return it('adds a subscriber to the channel');
      });
      describe('Unsubscribing', function() {
        beforeEach(function() {
          var i, subscriber;
          this.signal = 'foobar';
          return this.subscribers = (function() {
            var _i, _results;
            _results = [];
            for (i = _i = 0; _i <= 2; i = ++_i) {
              this.channel.on((subscriber = sinon.spy()));
              _results.push(subscriber);
            }
            return _results;
          }).call(this);
        });
        it('removes all subscribers when no callback is provided', function() {
          this.channel.off();
          return this.channel._subscribers.length.should.eq(0);
        });
        describe('When a callback is provided', function() {
          return it('removes a subscriber from the channel', function() {
            this.channel._subscribers.length.should.eq(3);
            this.channel.off(this.subscribers[0]);
            return this.channel._subscribers.length.should.eq(2);
          });
        });
        return describe('When context is provided', function() {
          return it('is limits subscriber matching');
        });
      });
      return describe('Publishing', function() {
        it('passes a message to all subscribers');
        return describe('When context is provided', function() {
          return it('is respected');
        });
      });
    });
  });

}).call(this);
