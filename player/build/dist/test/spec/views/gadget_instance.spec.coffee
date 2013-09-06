define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/gadget_instance'
], (Helpers, Fixtures, GadgetInstanceView) ->

  class BundledGadgetStub
    _.extend @::, Backbone.Events
    constructor: (facade) ->
      facade.on 'render', @onRender, @
    start: ->
    onRender: ->
    onConfigure: ->

  describe 'GadgetInstanceView', ->

    beforeEach ->
      @gadget = new vs.api.GadgetProject main: '...'
      @model = new vs.api.Gadget #project: @gadget
      @model.gadgetProject = @gadget
      @view = new GadgetInstanceView model: @model
      @view.render()

    afterEach ->
      @view.remove()

    it 'should set up events'
      # ...

    describe 'when successfully fetched', ->
      beforeEach ->
        @defaultConfig = { foo: 'bar' }
        @defaultUserState = { ding: 'bat' }
        @options = null
        @ctor = (options) => @options = options

      it 'should provide config', ->
        @model.config.set { prop: 'value' }
        @view.onFetchSuccess @ctor, defaultConfig: @defaultConfig
        @options.config.should.be.instanceOf Backbone.Model
        @options.config.get('prop').should.eq 'value'

      it 'should provide userState', ->
        @model.userState.set { prop: 'value' }
        @view.onFetchSuccess @ctor, defaultConfig: @defaultConfig
        @options.userState.should.be.instanceOf Backbone.Model
        @options.userState.get('prop').should.eq 'value'

      it 'should use defaultConfig if provided', ->
        @view.onFetchSuccess @ctor, defaultConfig: @defaultConfig
        @options.config.get('foo').should.eq @defaultConfig.foo

      it 'should use defaultUserState if provided', ->
        @view.onFetchSuccess @ctor, defaultUserState: @defaultUserState
        @options.userState.get('ding').should.eq @defaultUserState.ding

      it 'should prefer config over defaultConfig', ->
        @model.config.set { foo: 'baz' }
        @view.onFetchSuccess @ctor, defaultConfig: @defaultConfig
        @options.config.get('foo').should.eq 'baz'

      it 'should prefer userState over defaultUserState', ->
        @model.userState.set { ding: 'dong' }
        @view.onFetchSuccess @ctor, defaultUserState: @defaultUserState
        @options.userState.get('ding').should.eq 'dong'

      it 'should start the gadget', ->
        bundle = BundledGadgetStub
        stub = sinon.stub bundle::, 'onRender'
        @view.onFetchSuccess bundle
        stub.called.should.be.true
        stub.restore()

    describe 'After rendering', ->
      it 'should have class', ->
        @view.render()
        @view.onFetchSuccess BundledGadgetStub
        @view.$el.hasClass('gadget').should.be.true

    describe 'When bundle fails to load', ->
      beforeEach ->
        @view.render()

      it 'stops loading', ->
        spy = sinon.spy @view, 'showCouldNotLoad'
        @view.onFetchError {}
        spy.called.should.be.true

    describe 'After bundle is ready', ->
      beforeEach ->
        @view.render()
        @view.onFetchSuccess BundledGadgetStub

      describe 'Clicking .js-delete', ->
        clickDelete = (view) ->
          view.$('.js-trash').click()
          view.$('.js-delete').click()

        beforeEach ->
          @stub = sinon.stub @model, 'destroy'

        afterEach ->
          @stub.restore()

        it 'should disable edit mode', ->
          clickDelete @view
          @view._isEditing.should.eq false

        it 'should remove its model', ->
          clickDelete @view
          @stub.called.should.be.true

        it 'should trigger `domRemove` event', ->
          spy = sinon.spy()
          @view._facade.on 'domRemove', spy
          clickDelete @view
          spy.called.should.be.true

      describe 'Clicking .js-edit', ->
        it 'should toggle the .editing class', ->
          @view.toggleEdit false
          @view.$('.js-edit').click()
          @view.$el.hasClass('editing').should.be.true

        it 'should hide the properties', ->
          @view.togglePropertySheet true
          @view.toggleEdit false
          @view._configVisible.should.be.false

        it 'should show them again upon editing', ->
          @view.togglePropertySheet false
          @view.toggleEdit false
          @view.$('.js-edit').click()
          @view._configVisible.should.be.true
