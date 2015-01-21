function createLegacyLauncher(){
  var launcher = document.createElement('versal-legacy-launcher');
  launcher.setAttribute('data-environment', '{"test": "initial-environment", "assetUrlTemplate": "http://api/<%= id %>/foo"}');
  launcher.setAttribute('data-config', '{"test": "initial-config"}');
  launcher.setAttribute('data-userstate', '{"test": "initial-userstate"}');
  launcher.setAttribute('asset-url-template', '');
  launcher.setAttribute('gadget-css-class-name', 'foo-bar');
  launcher.setAttribute('gadget-base-url', '/base/versal-gadget-launchers/legacy-launcher/test_gadget');
  launcher.setAttribute('gadget-instance-url', 'http://example.org');
  return launcher;
};

describe('Legacy gadget launcher', function() {
  var launcher, options;
  launcher = options = null;

  beforeEach(function(done) {
    launcher = createLegacyLauncher();

    launcher.addEventListener('rendered', function() {
      options = window.gadgetOptions;
      done();
    });

    document.body.appendChild(launcher);
  });

  afterEach(function() {
    if (document.body.contains(launcher)) {
      document.body.removeChild(launcher);
    }
  });

  it('contains required properties in gadgetOptions', function() {
    expect(options).to.have.property('$el');
    expect(options).to.have.property('el');
    expect(options).to.have.property('player');
    expect(options).to.have.property('project');
    expect(options).to.have.property('config');
    expect(options).to.have.property('userState');
  });

  it('sets css class name on the element', function(){
    expect(launcher.children[0].classList.contains('foo-bar')).to.be.true;
  });

  it('contains gadgetBaseUrl in gadgetOptions', function() {
    expect(options.project).to.have.property('path');
    expect(options.project.path('blah')).to.equal('/base/versal-gadget-launchers/legacy-launcher/test_gadget/blah');
  });
  describe('receiving launcher events', function() {
    it('handles editableChanged (becomes toggleEdit)', function() {
      var stub = sinon.stub();
      options.player.on('toggleEdit', stub);
      launcher.setAttribute('editable', 'true');
      expect(stub.firstCall.args[0]).to.eq(true);
    });
    it('handles attributesChanged', function() {
      launcher.setAttribute('data-config', JSON.stringify({
        foo: 'bar',
        baz: 'barz'
      }));
      expect(options.config.toJSON()).to.deep.eq({
        foo: 'bar',
        baz: 'barz'
      });
    });
    it('handles works with pre-set attributes (in this case by cloning the launcher node)', function(done) {
      var otherLauncherContainer = document.createElement('div');
      document.body.appendChild(otherLauncherContainer);

      var otherLauncher = launcher.cloneNode(false);
      otherLauncher.addEventListener('rendered', function() {
        expect(window.gadgetOptions.config.toJSON()).to.deep.eq({
          test: 'initial-config'
        });

        document.body.removeChild(otherLauncherContainer);
        done();
      });

      otherLauncherContainer.appendChild(otherLauncher);
    });
    it('handles learnerStateChanged', function() {
      launcher.setAttribute('data-userstate', JSON.stringify({
        foo: 'bar',
        baz: 'barz'
      }));
      expect(options.userState.toJSON()).to.deep.eq({
        foo: 'bar',
        baz: 'barz'
      });
    });
    it('doesnt leak old attributes into the config when setting editable', function() {
      options.config.clear({silent: true});
      options.config.set({something: 'else'});
      launcher.setAttribute('editable', 'true');
      expect(options.config.toJSON()).to.deep.eq({something: 'else'});
    });
    it('doesnt send "close" event by default', function() {
      var stub = sinon.stub();
      options.player.on('close', stub);
      document.body.removeChild(launcher);
      expect(stub.called).to.eq(false);
    });
    it('sends "close" event when "should-fire-close-event-on-detached" is set', function(done) {
      options.player.on('close', function() {
        done();
      });
      launcher.setAttribute("should-fire-close-event-on-detached", true);
      document.body.removeChild(launcher);
    });
  });
  describe('sending launcher events', function() {
    it('triggers setEmpty', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setEmpty', stub);
      options.player.trigger('configEmpty');
      expect(stub.called).to.eq(true);
    });
    it('doesnt trigger setAttributes when editing-allowed is not set', function() {

      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);
      options.config.set({
        foo: 'barz',
        bar: 123
      });
      expect(stub.called).to.eq(false);
    });
    it('setting values silently prior to save triggers setAttributes', function() {
      launcher.setAttribute('editing-allowed', 'true');

      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);
      options.config.set({
        foo: 'barz',
        bar: 123
      }, {silent: true});
      options.config.save();
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        foo: 'barz',
        bar: 123
      });
    });
    it('triggers setAttributes', function() {
      launcher.setAttribute('editing-allowed', 'true');

      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);
      options.config.set({
        foo: 'barz',
        bar: 123
      });
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        foo: 'barz',
        bar: 123
      });
    });
    it('triggers setAttributes with the difference when changing an object by reference', function() {
      launcher.setAttribute('editing-allowed', 'true');

      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);

      var myObject = {};
      options.config.set({myObject: myObject});
      options.config.set({somethingElse: 1});
      myObject.hi = 'hi';
      options.config.save();
      expect(stub.thirdCall.args[0].detail).to.deep.eq({
        myObject: {hi: 'hi'},
        somethingElse: 1
      });
    });
    it('triggers setLearnerState', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setLearnerState', stub);
      options.userState.set({
        foo: 'barz',
        bar: 123
      });
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        foo: 'barz',
        bar: 123
      });
    });
    it('triggers setLearnerState with all changes when calling userState.set twice', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setLearnerState', stub);

      var myObject = {};
      options.userState.set({first: 1});
      options.userState.set({second: 2});
      expect(stub.secondCall.args[0].detail).to.deep.eq({
        first: 1,
        second: 2
      });
    });
    it('triggers setPropertySheetAttributes', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setPropertySheetAttributes', stub);
      options.propertySheetSchema.set({
        foo: 'barz',
        bar: 123
      });
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        foo: 'barz',
        bar: 123
      });
    });
    it('triggers track', function() {
      var stub = sinon.stub();
      launcher.addEventListener('track', stub);
      options.player.trigger('track', 'video-delay', {
        time: 123,
        age: 2
      });
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        '@type': 'video-delay',
        time: 123,
        age: 2
      });
    });
  });
  describe('PlayerInterface', function() {
    it('should implement selectAsset', function() {
      expect(_.isFunction(options.player.selectAsset)).to.eq(true);
    });
    describe('whitelisted events', function() {
      it('forwards asset:select', function() {
        var stub = sinon.stub();
        launcher.addEventListener('selectAsset', stub);
        options.player.trigger('asset:select', 'something');
        expect(stub.firstCall.args[0].detail).to.equal('something');
      });
      it('forwards blocking:changed', function() {
        var stub = sinon.stub();
        launcher.addEventListener('changeBlocking', stub);
        options.player.trigger('blocking:changed', 1, 2);
        expect(stub.called).to.eq(true);
      });
    });
    describe('#assetPath', function() {
      it('returns url with assetId filled in the assetUrlTemplate', function() {
        expect(options.player.assetPath('x73')).to.eq('http://api/x73/foo');
      });
    });
  });
});

describe('Broadcasting events', function(){
  var launcher1, launcher2;

  beforeEach(function(done){
    launcher1 = createLegacyLauncher();
    launcher2 = createLegacyLauncher();

    launcher2.addEventListener('rendered', function(){ done(); });

    document.body.appendChild(launcher1);
    document.body.appendChild(launcher2);
  });

  afterEach(function(){
    if(document.body.contains(launcher1)) {
      document.body.removeChild(launcher1);
    }
    if(document.body.contains(launcher2)) {
      document.body.removeChild(launcher2);
    }
  });

  it('receives broadcast event, sent by other gadget', function(done){
    launcher1.playerInterface.on('broadcast:receive', function(data){
      expect(data).to.equal('foo');
      done()
    });
    launcher2.playerInterface.trigger('broadcast:send', 'foo');
  });
});
