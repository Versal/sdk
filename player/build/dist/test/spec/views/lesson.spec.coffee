define [
  'app/mediator'
  'helpers/helpers'
  'helpers/fixtures'
  'views/lesson'
  'collections/gadget_catalogue'
], (mediator, Helpers, Fixtures, LessonView, GadgetCatalogue) ->

  getCatalogue = ->
    catalogue = new GadgetCatalogue
    sinon.stub catalogue, 'findGadgetByType', -> new vs.api.GadgetProject
    sinon.stub catalogue, 'buildInstanceOfType', ->
      gadget = new vs.api.Gadget
      gadget.gadgetProject = catalogue.findGadgetByType()
      gadget

    catalogue

  getSortableItem = (opts) ->
    item =
      remove: ->
    _.each opts, (value, key) ->
      item[key] = -> value
    item

  describe 'Gadget Instance', ->
    beforeEach ->
      @gadget = new vs.api.Gadget

    describe 'resolution', ->
      it 'should not resolve gadgets without projects', ->
        resolveErrorStub = sinon.stub @gadget, 'onResolveError'
        @gadget.resolve()
        resolveErrorStub.called.should.be.true

      it 'should resolve gadgets with existing constructors', ->
        successStub = sinon.stub @gadget, 'onResolveSuccess'
        @gadget.gadgetProject = new vs.api.GadgetProject
        @gadget.gadgetProject.set 'classDefinition', (->)
        @gadget.resolve()
        successStub.called.should.be.true

      it 'should trigger a resolve:success event on resolution', ->
        triggerSpy = sinon.spy()
        @gadget.on 'resolve:success', triggerSpy
        @gadget.gadgetProject = new vs.api.GadgetProject
        @gadget.gadgetProject.set 'classDefinition', (->)
        @gadget.resolve()
        triggerSpy.called.should.be.true

      it 'should trigger a resolve:success with a class definition', ->
        triggerSpy = sinon.spy()
        @gadget.on 'resolve:success', triggerSpy
        @gadget.gadgetProject = new vs.api.GadgetProject
        klass = (->)
        @gadget.gadgetProject.set 'classDefinition', klass
        @gadget.resolve()
        triggerSpy.args[0][0].should.eql klass

      it "should trigger a resolve:success with the gadgetProject's defaultConfig", ->
        triggerSpy = sinon.spy()
        @gadget.on 'resolve:success', triggerSpy
        @gadget.gadgetProject = new vs.api.GadgetProject
        defaultConfig = {default: 'config'}
        @gadget.gadgetProject.set defaultConfig: defaultConfig
        klass = (->)
        @gadget.gadgetProject.set 'classDefinition', klass
        @gadget.resolve()
        triggerSpy.args[0][1].defaultConfig.should.eql defaultConfig

      it "should trigger a resolve:success with the gadgetProject's defaultUserState", ->
        triggerSpy = sinon.spy()
        @gadget.on 'resolve:success', triggerSpy
        @gadget.gadgetProject = new vs.api.GadgetProject
        defaultUserState = {default: 'userState'}
        @gadget.gadgetProject.set defaultUserState: defaultUserState
        klass = (->)
        @gadget.gadgetProject.set 'classDefinition', klass
        @gadget.resolve()
        triggerSpy.args[0][1].defaultUserState.should.eql defaultUserState

      it 'should fetch gadgets if needed', ->

      # Will enable this test after I merge gadget fetching refactoring
      # AM
      it.skip 'should register stylesheets', ->
        mediatorTriggerStub = sinon.stub mediator, 'trigger'

        @gadget.gadgetProject = new vs.api.GadgetProject
        @gadget.resolve()

        mediatorTriggerStub.called.should.be.true
        mediatorTriggerStub.getCall(0).args[0].should.eq 'style:register'

        mediatorTriggerStub.restore()

  describe 'LessonView', ->

    beforeEach ->
      @model = new vs.api.Lesson Fixtures.Lesson(), url: '/foo/bar'
      @catalogue = getCatalogue()
      @view = new LessonView model: @model, catalogue: @catalogue
      @mediatorTriggerStub = sinon.stub mediator, 'trigger'
      @syncStub = sinon.stub @view.collection, 'sync'

    afterEach ->
      @view.remove()
      @mediatorTriggerStub.restore()

    describe 'Initializing', ->

      it 'should use .gadgets for its collection', ->
      # TODO fix me
        @view.render()
        @view.collection.should.equal @model.gadgets

      it 'should store a reference to the catalogue', ->
        @view.catalogue.should.equal @catalogue

    describe 'Rendering', ->
      describe 'When gadget catalogue is already available', ->
        beforeEach ->
          @catalogue._isReady = true

        it 'should resolve each gadget', ->
          stub = sinon.stub @view, 'resolveGadgets'
          @view.onRender()
          stub.called.should.be.true
          stub.restore()

    describe 'Rendering gadgets', ->
      describe 'gadget:rendered events', ->
        beforeEach ->
          @view.render()
          @view.children.length.should.eq 4
          @view.children.each (i) -> i.trigger 'gadgetRendered'

        it 'should trigger for every child', ->
          @mediatorTriggerStub.withArgs('gadget:rendered').callCount.should.eq 4

        it 'should be triggered but not completed for the first gadgets', ->
          @mediatorTriggerStub.calledWith("gadget:rendered",
            @view.children.findByIndex(0),
            false).should.be.true
          @mediatorTriggerStub.calledWith("gadget:rendered",
            @view.children.findByIndex(1),
            false).should.be.true
          @mediatorTriggerStub.calledWith("gadget:rendered",
            @view.children.findByIndex(2),
            false).should.be.true

        it 'should indicate true when every gadget is rendered', ->
          @mediatorTriggerStub.calledWith("gadget:rendered",
            @view.children.findByIndex(3),
            true).should.be.true

    describe 'When gadget catalogue becomes available', ->
      it 'should resolve each gadget', ->
        stub = sinon.stub @view, 'resolveGadgets'
        @catalogue.trigger 'sync', @catalogue
        stub.called.should.be.true
        stub.restore()

    describe 'When a sortable item is received', ->

      beforeEach ->
        @view.render()
        @expected =
          type: 'foobar'
          index: 1
        @item = getSortableItem { data: @expected.type, index: @expected.index }

      it 'should be converted to a gadget', ->
        stub = sinon.stub @view, 'insertGadgetTypeAt'
        @view.onSortReceive {}, item: @item
        stub.calledWith(@expected.type, @expected.index).should.be.true
        stub.restore()

      it 'should be added to the collection', ->
        stub = sinon.stub @view.collection, 'create'
        @view.onSortReceive {}, item: @item
        stub.called.should.be.true
        stub.restore()

      it 'should retrieve the gadget bundle', ->
        url = 'http://example.com/gadgets/foobar.js'
        stub = sinon.stub window, 'require'
        @view.insertGadgetTypeAt 'foobar', 0
        stub.called.should.be.true
        stub.restore()

      it 'should be added at the correct index', ->
        stub = sinon.spy @view, 'insertGadgetTypeAt'
        @view.onSortReceive {}, item: @item
        stub.firstCall.args[1].should.eq @expected.index
        stub.restore()

    describe 'When a Gadget is being edited', ->

      beforeEach ->
        @view.render()
        @first = @view.children.first()
        @view.children.last().toggleEdit true

      it 'should close currently active gadget', ->
        stub = sinon.stub @view.children.last(), 'toggleEdit'
        @first.toggleEdit true
        stub.calledWith(false).should.eq true
        stub.restore()

      it 'should not close the active gadget', ->
        spy = sinon.spy @first, 'toggleEdit'
        @first.toggleEdit true
        spy.calledWith(false).should.be.false
        spy.restore()

      it 'should not allow any other gadgets to be active', ->
        @view.children.each (child, i) ->
          child.toggleEdit true
        @first.toggleEdit true
        @view.children.each (child, i) ->
          child._isEditing.should.eq false if i


    describe 'When gadget collection is sorted', ->
      beforeEach ->
        @view.render()

      it 'should trigger reorder', ->
        @model.url = -> '/courses/42/lessons'
        model = @view.collection.first()
        @view.collection.move model, 0
        @syncStub.called.should.be.true
