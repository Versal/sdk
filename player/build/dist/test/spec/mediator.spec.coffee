define [
  'app/mediator'
], (Mediator) ->

  describe 'Events', ->

    beforeEach ->
      @mediator = Events

    describe 'When an event is received', ->

      beforeEach ->
        @payload = foo: 'bar'

      it 'should be passed to handler', ->
 
      it 'should work', ->

