describe('legacy iframe launcher', function(){
  var launcher = null;
  var legacyLauncher = null;

  var fixtureAttributes = {
    'data-environment': {
      "assetUrlTemplate": "https://stack.versal.com/api2/assets/<%= id %>",
      "baseUrl": "/base/versal-gadget-launchers/legacy-launcher/test_gadget",
      "cssClassName": "gadget-foo-bar-0_0_0",
      "editingAllowed": true
    },
    'data-config': {
      "foo": "bar"
    }
  };

  beforeEach(function(done){
    launcher = document.createElement('versal-iframe-launcher');
    launcher.setAttribute('src', '/base/versal-gadget-launchers/legacy-iframe-launcher/versal.html');

    launcher.addEventListener('rendered', function(){
      legacyLauncher = launcher.iframe.contentWindow.document.querySelector('versal-legacy-launcher');
      done();
    });

    Object.keys(fixtureAttributes).forEach(function(key){
      launcher.setAttribute(key, JSON.stringify(fixtureAttributes[key]));
    });

    document.body.appendChild(launcher);
  });

  afterEach(function(){
    document.body.removeChild(launcher);
  });

  it('creates legacy launcher behind the scenes', function(){
    expect(legacyLauncher).to.exist();
  });

  it('legacy launcher has all the required attributes', function(){
    expect(legacyLauncher.getAttribute('gadget-base-url')).to.eq('/base/versal-gadget-launchers/legacy-launcher/test_gadget');
    expect(legacyLauncher.getAttribute('gadget-css-class-name')).to.eq('gadget-foo-bar-0_0_0');
    expect(legacyLauncher.getAttribute('editing-allowed')).to.eq('true');
    expect(legacyLauncher.getAttribute('data-config')).to.eql('{"foo":"bar"}');
  });

  describe('changing attributes of iframe launcher must change attributes of nested legacy launcher', function(){
    it('toggleEdit', function(done){
      launcher.setAttribute('editable', 'true');
      // We must clear the stack so mutation observers have a chance to fire
      setTimeout(function(){
        expect(legacyLauncher.getAttribute('editable')).to.eq('true');
        done();
      }, 1);
    });

    it('data-config', function(done){
      launcher.setAttribute('data-config', '{"x":"y"}');
      setTimeout(function(){
        expect(legacyLauncher.getAttribute('data-config')).to.eql('{"x":"y"}');
        done();
      }, 1);
    });

    it('data-userstate', function(done){
      launcher.setAttribute('data-userstate', '{ "a": 1 }');
      setTimeout(function(){
        expect(legacyLauncher.getAttribute('data-userstate')).to.eql('{"a":1}');
        done();
      }, 1);
    });
  });

  describe('changing config of legacy launcher must change attributes of iframe launcher', function(){
    beforeEach(function(){
      launcher.setAttribute('editable', 'true');
    });

    // It doesn't work. If you are to fix it - ever - you need to fix legacyLauncher's findDeepChangedAttributes
    it.skip('unset config attribute', function(done){
      legacyLauncher._config.unset('foo');

      setTimeout(function(){
        expect(launcher.getAttribute('data-config')).to.eq('{}');
        done();
      }, 50)
    });

    it('set key of config to null', function(done){
      legacyLauncher._config.set({ foo: null });

      setTimeout(function(){
        expect(launcher.getAttribute('data-config')).to.eq('{}');
        done();
      }, 50)
    });

    it('update config in one pass', function(done){
      legacyLauncher._config.set({ a: 1, b: 2 });

      setTimeout(function(){
        expect(launcher.getAttribute('data-config')).to.eq('{"foo":"bar","a":1,"b":2}');
        done();
      }, 50)
    });

    it('update config in multiple passes', function(done){
      legacyLauncher._config.set({ a: 3 });
      legacyLauncher._config.set({ b: 4 });

      setTimeout(function(){
        expect(launcher.getAttribute('data-config')).to.eq('{"foo":"bar","a":3,"b":4}');
        done();
      }, 50)
    });
  });

  describe('changing userstate of legacy launcher must change attributes of iframe launcher', function(){
    beforeEach(function(){
      // Redundant but illustrative. Gadget must not be editable in order to change userstate.
      launcher.setAttribute('editable', 'false');
    });

    // It doesn't work. If you are to fix it - ever - you need to fix legacyLauncher's findDeepChangedAttributes
    it.skip('unset userstate attribute', function(done){
      legacyLauncher._userstate.unset('foo');

      setTimeout(function(){
        expect(launcher.getAttribute('data-userstate')).to.eq('{}');
        done();
      }, 50)
    });

    it('set key of userstate to null', function(done){
      legacyLauncher._userstate.set({ foo: null });

      setTimeout(function(){
        expect(launcher.getAttribute('data-userstate')).to.eq('{}');
        done();
      }, 50)
    });

    it('update userstate in one pass', function(done){
      legacyLauncher._userstate.set({ a: 1, b: 2 });

      setTimeout(function(){
        expect(launcher.getAttribute('data-userstate')).to.eq('{"a":1,"b":2}');
        done();
      }, 50)
    });

    it('update userstate in multiple passes', function(done){
      legacyLauncher._userstate.set({ a: 3 });
      legacyLauncher._userstate.set({ b: 4 });

      setTimeout(function(){
        expect(launcher.getAttribute('data-userstate')).to.eq('{"a":3,"b":4}');
        done();
      }, 50)
    });
  });

  describe('some other APIs', function(){
    it('setPropertySheetAttributes', function(done){
      launcher.addEventListener('setPropertySheetAttributes', function(evt){
        expect(evt.detail).to.eql({ foo: { type: 'string' } });
        done();
      });

      legacyLauncher._propertySheetSchema.set({ foo: { type: 'string' } });
    });

    it('setPropertySheetAttributes with validators omits validators', function(done){
      launcher.addEventListener('setPropertySheetAttributes', function(evt){
        expect(evt.detail.foo).not.to.include.keys('validators');
        done();
      });

      legacyLauncher._propertySheetSchema.set({ foo: { type: 'string', validators: [function(){}] }});
    });

    it('setEmpty', function(done){
      launcher.addEventListener('setEmpty', function(){
        done();
      });

      legacyLauncher.playerInterface.trigger('configEmpty');
    });

    it('blockingChanged', function(done){
      launcher.addEventListener('changeBlocking', function(){
        done();
      });

      legacyLauncher.playerInterface.trigger('blocking:changed');
    });

    it('select asset', function(done){
      legacyLauncher.playerInterface.trigger('asset:select', {
        type: 'image',
        success: function(){ done(); }
      });

      launcher.addEventListener('requestAsset', function(evt){
        // When a user uploads an asset, asset json is passed back in attribute named "__asset__"
        var config = {};
        config[evt.detail.attribute] = { location: 'some/url' };
        launcher.setAttribute('data-config', JSON.stringify(config));
      })
    });
  });
});
