(function() {

  define(['app/mediator', 'helpers/helpers', 'helpers/fixtures', 'views/lesson', 'collections/gadget_catalogue'], function(mediator, Helpers, Fixtures, LessonView, GadgetCatalogue) {
    var getCatalogue, getSortableItem;
    getCatalogue = function() {
      var catalogue;
      catalogue = new GadgetCatalogue;
      sinon.stub(catalogue, 'findGadgetByType', function() {
        return new vs.api.GadgetProject;
      });
      sinon.stub(catalogue, 'buildInstanceOfType', function() {
        var gadget;
        gadget = new vs.api.Gadget;
        gadget.gadgetProject = catalogue.findGadgetByType();
        gadget.resolve = function() {};
        return gadget;
      });
      return catalogue;
    };
    getSortableItem = function(opts) {
      var item;
      item = {
        remove: function() {}
      };
      _.each(opts, function(value, key) {
        return item[key] = function() {
          return value;
        };
      });
      return item;
    };
    describe('Gadget Instance', function() {
      beforeEach(function() {
        return this.gadget = new vs.api.Gadget;
      });
      return describe('resolution', function() {
        it('should not resolve gadgets without projects', function() {
          var resolveErrorStub;
          resolveErrorStub = sinon.stub(this.gadget, 'onResolveError');
          this.gadget.resolve();
          return resolveErrorStub.called.should.be["true"];
        });
        it('should resolve gadgets with existing constructors', function() {
          var successStub;
          successStub = sinon.stub(this.gadget, 'onResolveSuccess');
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          this.gadget.gadgetProject.set('classDefinition', (function() {}));
          this.gadget.resolve();
          return successStub.called.should.be["true"];
        });
        it('should trigger a resolve:success event on resolution', function() {
          var triggerSpy;
          triggerSpy = sinon.spy();
          this.gadget.on('resolve:success', triggerSpy);
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          this.gadget.gadgetProject.set('classDefinition', (function() {}));
          this.gadget.resolve();
          return triggerSpy.called.should.be["true"];
        });
        it('should trigger a resolve:success with a class definition', function() {
          var klass, triggerSpy;
          triggerSpy = sinon.spy();
          this.gadget.on('resolve:success', triggerSpy);
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          klass = (function() {});
          this.gadget.gadgetProject.set('classDefinition', klass);
          this.gadget.resolve();
          return triggerSpy.args[0][0].should.eql(klass);
        });
        it("should trigger a resolve:success with the gadgetProject's defaultConfig", function() {
          var defaultConfig, klass, triggerSpy;
          triggerSpy = sinon.spy();
          this.gadget.on('resolve:success', triggerSpy);
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          defaultConfig = {
            "default": 'config'
          };
          this.gadget.gadgetProject.set({
            defaultConfig: defaultConfig
          });
          klass = (function() {});
          this.gadget.gadgetProject.set('classDefinition', klass);
          this.gadget.resolve();
          return triggerSpy.args[0][1].defaultConfig.should.eql(defaultConfig);
        });
        it("should trigger a resolve:success with the gadgetProject's defaultUserState", function() {
          var defaultUserState, klass, triggerSpy;
          triggerSpy = sinon.spy();
          this.gadget.on('resolve:success', triggerSpy);
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          defaultUserState = {
            "default": 'userState'
          };
          this.gadget.gadgetProject.set({
            defaultUserState: defaultUserState
          });
          klass = (function() {});
          this.gadget.gadgetProject.set('classDefinition', klass);
          this.gadget.resolve();
          return triggerSpy.args[0][1].defaultUserState.should.eql(defaultUserState);
        });
        it('should fetch gadgets if needed', function() {});
        return it.skip('should register stylesheets', function() {
          var mediatorTriggerStub;
          mediatorTriggerStub = sinon.stub(mediator, 'trigger');
          this.gadget.gadgetProject = new vs.api.GadgetProject;
          this.gadget.resolve();
          mediatorTriggerStub.called.should.be["true"];
          mediatorTriggerStub.getCall(0).args[0].should.eq('style:register');
          return mediatorTriggerStub.restore();
        });
      });
    });
    return describe('LessonView', function() {
      beforeEach(function() {
        this.model = new vs.api.Lesson(Fixtures.Lesson(), {
          url: '/foo/bar'
        });
        this.catalogue = getCatalogue();
        this.view = new LessonView({
          model: this.model,
          catalogue: this.catalogue
        });
        this.mediatorTriggerStub = sinon.stub(mediator, 'trigger');
        return this.syncStub = sinon.stub(this.view.collection, 'sync');
      });
      afterEach(function() {
        this.view.remove();
        return this.mediatorTriggerStub.restore();
      });
      describe('Initializing', function() {
        it('should use .gadgets for its collection', function() {
          this.view.render();
          return this.view.collection.should.equal(this.model.gadgets);
        });
        return it('should store a reference to the catalogue', function() {
          return this.view.catalogue.should.equal(this.catalogue);
        });
      });
      describe('Rendering', function() {
        return describe('When gadget catalogue is already available', function() {
          beforeEach(function() {
            return this.catalogue._isReady = true;
          });
          return it('should resolve each gadget', function() {
            var stub;
            stub = sinon.stub(this.view, 'resolveGadgets');
            this.view.onRender();
            stub.called.should.be["true"];
            return stub.restore();
          });
        });
      });
      describe('Rendering gadgets', function() {
        return describe('gadget:rendered events', function() {
          beforeEach(function() {
            this.view.render();
            this.view.children.length.should.eq(4);
            return this.view.children.each(function(i) {
              return i.trigger('gadgetRendered');
            });
          });
          it('should trigger for every child', function() {
            return this.mediatorTriggerStub.withArgs('gadget:rendered').callCount.should.eq(4);
          });
          it('should be triggered but not completed for the first gadgets', function() {
            this.mediatorTriggerStub.calledWith("gadget:rendered", this.view.children.findByIndex(0), false).should.be["true"];
            this.mediatorTriggerStub.calledWith("gadget:rendered", this.view.children.findByIndex(1), false).should.be["true"];
            return this.mediatorTriggerStub.calledWith("gadget:rendered", this.view.children.findByIndex(2), false).should.be["true"];
          });
          return it('should indicate true when every gadget is rendered', function() {
            return this.mediatorTriggerStub.calledWith("gadget:rendered", this.view.children.findByIndex(3), true).should.be["true"];
          });
        });
      });
      describe('When gadget catalogue becomes available', function() {
        return it('should resolve each gadget', function() {
          var stub;
          stub = sinon.stub(this.view, 'resolveGadgets');
          this.catalogue.trigger('sync', this.catalogue);
          stub.called.should.be["true"];
          return stub.restore();
        });
      });
      describe('When a sortable item is received', function() {
        beforeEach(function() {
          this.view.render();
          this.expected = {
            type: 'foobar',
            index: 1
          };
          return this.item = getSortableItem({
            data: this.expected.type,
            index: this.expected.index
          });
        });
        it('should be converted to a gadget', function() {
          var stub;
          stub = sinon.stub(this.view, 'insertGadgetTypeAt');
          this.view.onSortReceive({}, {
            item: this.item
          });
          stub.calledWith(this.expected.type, this.expected.index).should.be["true"];
          return stub.restore();
        });
        it('should be added to the collection', function() {
          var stub;
          stub = sinon.stub(this.view.collection, 'create');
          this.view.onSortReceive({}, {
            item: this.item
          });
          stub.called.should.be["true"];
          return stub.restore();
        });
        return it('should be added at the correct index', function() {
          var stub;
          stub = sinon.spy(this.view, 'insertGadgetTypeAt');
          this.view.onSortReceive({}, {
            item: this.item
          });
          stub.firstCall.args[1].should.eq(this.expected.index);
          return stub.restore();
        });
      });
      describe('When a Gadget is being edited', function() {
        beforeEach(function() {
          this.view.render();
          this.first = this.view.children.first();
          return this.view.children.last().toggleEdit(true);
        });
        it('should close currently active gadget', function() {
          var stub;
          stub = sinon.stub(this.view.children.last(), 'toggleEdit');
          this.first.toggleEdit(true);
          stub.calledWith(false).should.eq(true);
          return stub.restore();
        });
        it('should not close the active gadget', function() {
          var spy;
          spy = sinon.spy(this.first, 'toggleEdit');
          this.first.toggleEdit(true);
          spy.calledWith(false).should.be["false"];
          return spy.restore();
        });
        return it('should not allow any other gadgets to be active', function() {
          this.view.children.each(function(child, i) {
            return child.toggleEdit(true);
          });
          this.first.toggleEdit(true);
          return this.view.children.each(function(child, i) {
            if (i) {
              return child._isEditing.should.eq(false);
            }
          });
        });
      });
      return describe('When gadget collection is sorted', function() {
        beforeEach(function() {
          return this.view.render();
        });
        return it('should trigger reorder', function() {
          var model;
          this.model.url = function() {
            return '/courses/42/lessons';
          };
          model = this.view.collection.first();
          this.view.collection.move(model, 0);
          return this.syncStub.called.should.be["true"];
        });
      });
    });
  });

}).call(this);
