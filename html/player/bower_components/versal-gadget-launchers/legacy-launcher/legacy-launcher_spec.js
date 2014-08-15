describe('Legacy gadget launcher', function() {
  var launcher, options;
  launcher = options = null;

  beforeEach(function(done) {
    launcher = document.createElement('versal-legacy-launcher');
    launcher.setAttribute('data-environment', '{"test": "initial-environment", "assetUrlTemplate": "http://api/<%= id %>/foo"}');
    launcher.setAttribute('data-config', '{"test": "initial-config"}');
    launcher.setAttribute('data-userstate', '{"test": "initial-userstate"}');
    launcher.setAttribute('asset-url-template', '');
    launcher.setAttribute('gadget-base-url', '/base/legacy-launcher/test_gadget');
    launcher.setAttribute('gadget-instance-url', 'http://example.org');

    launcher.addEventListener('rendered', function() {
      options = window.gadgetOptions;
      done();
    });

    document.body.appendChild(launcher);
  });

  it('contains required properties in gadgetOptions', function() {
    expect(options).to.have.property('$el');
    expect(options).to.have.property('el');
    expect(options).to.have.property('player');
    expect(options).to.have.property('project');
    expect(options).to.have.property('config');
    expect(options).to.have.property('userState');
  });
  it('contains gadgetBaseUrl in gadgetOptions', function() {
    expect(options.project).to.have.property('path');
    expect(options.project.path('blah')).to.equal('/base/legacy-launcher/test_gadget/blah');
  });
  describe('receiving launcher events', function() {
    it('handles editableChanged (becomes toggleEdit)', function() {
      var stub = sinon.stub();
      options.player.on('toggleEdit', stub);
      launcher.setAttribute('editable', 'true');
      expect(stub.firstCall.args[0]).to.be["true"];
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
    it('handle slearnerStateChanged', function() {
      launcher.setAttribute('data-userstate', JSON.stringify({
        foo: 'bar',
        baz: 'barz'
      }));
      expect(options.userState.toJSON()).to.deep.eq({
        foo: 'bar',
        baz: 'barz'
      });
    });
    it('doesnt send "close" event by default', function() {
      var stub = sinon.stub();
      options.player.on('close', stub);
      document.body.removeChild(launcher);
      expect(stub.called).to.be["false"];
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
      expect(stub.called).to.be["true"];
    });
    it('setting values silently prior to save triggers setAttributes', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);
      options.config.set({
        foo: 'barz',
        bar: 123
      }, {silent: true});
      options.config.save();
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        test: 'initial-config',
        foo: 'barz',
        bar: 123
      });
    });
    it('triggers setAttributes', function() {
      var stub = sinon.stub();
      launcher.addEventListener('setAttributes', stub);
      options.config.set({
        foo: 'barz',
        bar: 123
      });
      expect(stub.firstCall.args[0].detail).to.deep.eq({
        test: 'initial-config',
        foo: 'barz',
        bar: 123
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
        test: 'initial-userstate',
        foo: 'barz',
        bar: 123
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
      expect(_.isFunction(options.player.selectAsset)).to.be.true;
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
        expect(stub.firstCall).to.exist;
      });
    });
    describe('#assetPath', function() {
      it('returns url with assetId filled in the assetUrlTemplate', function() {
        expect(options.player.assetPath('x73')).to.eq('http://api/x73/foo');
      });
    });
  });
});
