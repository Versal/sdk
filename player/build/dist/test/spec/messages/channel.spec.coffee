define [
  'messages/channel'
], (Channel) ->

  describe 'Channel', ->
    beforeEach ->
      @channel = new Channel

    it 'has subscribers'
    it 'has subchannels'

    describe 'Subscribing', ->
      it 'adds a subscriber to the channel'

    describe 'Unsubscribing', ->
      beforeEach ->
        @signal = 'foobar'
        @subscribers = for i in [0..2]
          @channel.on (subscriber = sinon.spy())
          subscriber

      it 'removes all subscribers when no callback is provided', ->
        @channel.off()
        @channel._subscribers.length.should.eq 0

      describe 'When a callback is provided', ->
        it 'removes a subscriber from the channel', ->
          @channel._subscribers.length.should.eq 3
          @channel.off @subscribers[0]
          @channel._subscribers.length.should.eq 2

      describe 'When context is provided', ->
        it 'is limits subscriber matching'

    describe 'Publishing', ->
      it 'passes a message to all subscribers'
      describe 'When context is provided', ->
        it 'is respected'

