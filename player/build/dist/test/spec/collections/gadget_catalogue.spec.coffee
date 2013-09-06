require [
  'helpers/helpers'
  'helpers/fixtures'
  'collections/gadget_catalogue'
], (Helpers, Fixtures, GadgetCatalogue) ->

  describe 'GadgetCatalogue', ->

    beforeEach ->
      @collection = new GadgetCatalogue

    describe 'initializing', ->
      it 'should not be ready', ->
        @collection.isReady().should.be.false

    describe 'When sync\'d with the server', ->
      beforeEach ->
        @ready = sinon.spy()
        @collection.on 'ready', @ready

      describe 'When it wasn\'t ready', ->
        it 'should become ready', ->
          @collection.trigger 'sync', @collection
          @collection.isReady().should.be.true

        it 'should fire a ready event', ->
          @collection.trigger 'sync', @collection
          @ready.calledOnce.should.be.true

      describe 'When it was already ready', ->
        beforeEach ->
          @collection._isReady = true

        it 'should do nothing', ->
          @collection.trigger 'sync', @collection
          @ready.called.should.be.false
