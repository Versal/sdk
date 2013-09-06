define [
  'messages/mediator'
], (Mediator) ->

  describe 'Mediator', ->
   
    beforeEach ->
      @data = content: 'foobar'
      @mediator = new Mediator
      @handler = sinon.spy()
  
    it 'subscribes and triggers', ->
      @mediator.on 'channel', @handler
      @mediator.trigger 'channel', @data
      @handler.calledWith(@data).should.be.true

    it 'handles off', ->
      @mediator.on 'channel', @handler
      @mediator.off 'channel', @handler
      @mediator.trigger 'channel', @data
      @handler.called.should.be.false

