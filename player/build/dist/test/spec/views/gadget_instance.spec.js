(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/gadget_instance'], function(Helpers, Fixtures, GadgetInstanceView) {
    var BundledGadgetStub;
    BundledGadgetStub = (function() {

      _.extend(BundledGadgetStub.prototype, Backbone.Events);

      function BundledGadgetStub(facade) {
        facade.on('render', this.onRender, this);
      }

      BundledGadgetStub.prototype.start = function() {};

      BundledGadgetStub.prototype.onRender = function() {};

      BundledGadgetStub.prototype.onConfigure = function() {};

      return BundledGadgetStub;

    })();
    return describe('GadgetInstanceView', function() {
      beforeEach(function() {
        this.gadget = new vs.api.GadgetProject({
          main: '...'
        });
        this.model = new vs.api.Gadget;
        this.model.gadgetProject = this.gadget;
        this.view = new GadgetInstanceView({
          model: this.model
        });
        return this.view.render();
      });
      afterEach(function() {
        return this.view.remove();
      });
      it('should set up events');
      describe('when successfully fetched', function() {
        beforeEach(function() {
          var _this = this;
          this.defaultConfig = {
            foo: 'bar'
          };
          this.defaultUserState = {
            ding: 'bat'
          };
          this.options = null;
          return this.ctor = function(options) {
            return _this.options = options;
          };
        });
        it('should provide config', function() {
          this.model.config.set({
            prop: 'value'
          });
          this.view.onFetchSuccess(this.ctor, {
            defaultConfig: this.defaultConfig
          });
          this.options.config.should.be.instanceOf(Backbone.Model);
          return this.options.config.get('prop').should.eq('value');
        });
        it('should provide userState', function() {
          this.model.userState.set({
            prop: 'value'
          });
          this.view.onFetchSuccess(this.ctor, {
            defaultConfig: this.defaultConfig
          });
          this.options.userState.should.be.instanceOf(Backbone.Model);
          return this.options.userState.get('prop').should.eq('value');
        });
        it('should use defaultConfig if provided', function() {
          this.view.onFetchSuccess(this.ctor, {
            defaultConfig: this.defaultConfig
          });
          return this.options.config.get('foo').should.eq(this.defaultConfig.foo);
        });
        it('should use defaultUserState if provided', function() {
          this.view.onFetchSuccess(this.ctor, {
            defaultUserState: this.defaultUserState
          });
          return this.options.userState.get('ding').should.eq(this.defaultUserState.ding);
        });
        it('should prefer config over defaultConfig', function() {
          this.model.config.set({
            foo: 'baz'
          });
          this.view.onFetchSuccess(this.ctor, {
            defaultConfig: this.defaultConfig
          });
          return this.options.config.get('foo').should.eq('baz');
        });
        it('should prefer userState over defaultUserState', function() {
          this.model.userState.set({
            ding: 'dong'
          });
          this.view.onFetchSuccess(this.ctor, {
            defaultUserState: this.defaultUserState
          });
          return this.options.userState.get('ding').should.eq('dong');
        });
        return it('should start the gadget', function() {
          var bundle, stub;
          bundle = BundledGadgetStub;
          stub = sinon.stub(bundle.prototype, 'onRender');
          this.view.onFetchSuccess(bundle);
          stub.called.should.be["true"];
          return stub.restore();
        });
      });
      describe('After rendering', function() {
        return it('should have class', function() {
          this.view.render();
          this.view.onFetchSuccess(BundledGadgetStub);
          return this.view.$el.hasClass('gadget').should.be["true"];
        });
      });
      describe('When bundle fails to load', function() {
        beforeEach(function() {
          return this.view.render();
        });
        return it('stops loading', function() {
          var spy;
          spy = sinon.spy(this.view, 'showCouldNotLoad');
          this.view.onFetchError({});
          return spy.called.should.be["true"];
        });
      });
      return describe('After bundle is ready', function() {
        beforeEach(function() {
          this.view.render();
          return this.view.onFetchSuccess(BundledGadgetStub);
        });
        describe('Clicking .js-delete', function() {
          var clickDelete;
          clickDelete = function(view) {
            view.$('.js-trash').click();
            return view.$('.js-delete').click();
          };
          beforeEach(function() {
            return this.stub = sinon.stub(this.model, 'destroy');
          });
          afterEach(function() {
            return this.stub.restore();
          });
          it('should disable edit mode', function() {
            clickDelete(this.view);
            return this.view._isEditing.should.eq(false);
          });
          it('should remove its model', function() {
            clickDelete(this.view);
            return this.stub.called.should.be["true"];
          });
          return it('should trigger `domRemove` event', function() {
            var spy;
            spy = sinon.spy();
            this.view._facade.on('domRemove', spy);
            clickDelete(this.view);
            return spy.called.should.be["true"];
          });
        });
        return describe('Clicking .js-edit', function() {
          it('should toggle the .editing class', function() {
            this.view.toggleEdit(false);
            this.view.$('.js-edit').click();
            return this.view.$el.hasClass('editing').should.be["true"];
          });
          it('should hide the properties', function() {
            this.view.togglePropertySheet(true);
            this.view.toggleEdit(false);
            return this.view._configVisible.should.be["false"];
          });
          return it('should show them again upon editing', function() {
            this.view.togglePropertySheet(false);
            this.view.toggleEdit(false);
            this.view.$('.js-edit').click();
            return this.view._configVisible.should.be["true"];
          });
        });
      });
    });
  });

}).call(this);