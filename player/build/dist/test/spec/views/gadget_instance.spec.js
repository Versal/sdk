(function() {

  define(['helpers/helpers', 'helpers/fixtures', 'views/gadget_instance', 'app/mediator'], function(Helpers, Fixtures, GadgetInstanceView, mediator) {
    var BundledGadgetStub;
    BundledGadgetStub = (function() {

      _.extend(BundledGadgetStub.prototype, Backbone.Events);

      function BundledGadgetStub(_arg) {
        this.el = _arg.el, this.player = _arg.player, this.config = _arg.config;
        this.player.on('render', this.onRender, this);
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
        it('should start the gadget', function() {
          var bundle, stub;
          bundle = BundledGadgetStub;
          stub = sinon.stub(bundle.prototype, 'onRender');
          this.view.onFetchSuccess(bundle);
          stub.called.should.be["true"];
          return stub.restore();
        });
        return describe('when a gadget is dropped', function() {
          return describe('and gadget is in an editing state', function() {
            it('should notify other views', function() {
              var bundle, dropSpy;
              dropSpy = sinon.spy();
              mediator.on('gadget:drop', dropSpy);
              this.view.isEditable = true;
              this.model.dropped = true;
              bundle = BundledGadgetStub;
              this.view.onFetchSuccess(bundle);
              return dropSpy.called.should.be["true"];
            });
            return it('should move to a non-editing state', function() {
              this.otherView = new GadgetInstanceView({
                model: new vs.api.Gadget
              });
              this.view.toggleEdit(true);
              this.view.$el.hasClass('editing').should.be["true"];
              this.view.onGadgetDrop(this.otherView);
              return this.view.$el.hasClass('editing').should.be["false"];
            });
          });
        });
      });
      describe('After rendering', function() {
        return it('should have class', function() {
          this.view.onFetchSuccess(BundledGadgetStub);
          return this.view.$el.hasClass('gadget').should.be["true"];
        });
      });
      describe('When bundle fails to load', function() {
        return it('stops loading', function() {
          var spy;
          spy = sinon.spy(this.view, 'showCouldNotLoad');
          this.view.onFetchError({});
          return spy.called.should.be["true"];
        });
      });
      describe('After bundle is ready', function() {
        beforeEach(function() {
          return this.view.onFetchSuccess(BundledGadgetStub);
        });
        describe('Clicking delete', function() {
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
        describe('Clicking edit', function() {
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
        describe('Clicking outside gadget', function() {
          return describe('when the gadget is in an editing state', function() {
            return it('should move gadget to a non-editing state', function() {
              this.view.toggleEdit(true);
              this.view.$el.hasClass('editing').should.be["true"];
              this.view.onCourseClick({
                target: $(document).get(0)
              });
              return this.view.$el.hasClass('editing').should.be["false"];
            });
          });
        });
        return describe('Clicking inside gadget', function() {
          return describe('when the gadget is in an editing state', function() {
            return it('should stay in an editing state', function() {
              this.view.toggleEdit(true);
              this.view.$el.hasClass('editing').should.be["true"];
              this.view.onCourseClick({
                target: this.view.$el.find(':last').get(0)
              });
              return this.view.$el.hasClass('editing').should.be["true"];
            });
          });
        });
      });
      return describe('Dropping', function() {
        return describe('when another gadget is dropped', function() {
          return describe('and the current gadget is in an editing state', function() {
            return it('should move current gadget to a non-editing state', function() {
              this.otherView = new GadgetInstanceView({
                model: new vs.api.Gadget
              });
              this.view.toggleEdit(true);
              this.view.$el.hasClass('editing').should.be["true"];
              this.view.onGadgetDrop(this.otherView);
              return this.view.$el.hasClass('editing').should.be["false"];
            });
          });
        });
      });
    });
  });

}).call(this);
