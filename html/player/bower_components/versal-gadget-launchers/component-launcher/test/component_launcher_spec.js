/* global describe, it, expect, Promise, beforeEach, afterEach */
describe('iframe launcher', function() {
  var launcher;

  //WebComponentsReady event is
  //fired only once after custom elments polyfill finished its start up tasks
  //all subequent upgrades are done by MutationObserver hence no more events
  var promise = new Promise(function(resolve, reject){
    window.addEventListener('WebComponentsReady', function() {
      resolve();
    });
  });

  beforeEach(function(done) {
    launcher = document.createElement('versal-component-launcher');
    launcher.setAttribute('data-config', '{"test": "initial-config"}');
    launcher.setAttribute('src', '/base/component-launcher/test/test_gadget.html');
    document.body.appendChild(launcher);

    promise.then(function(){
      done();
    });
  });

  afterEach(function() {
    document.body.removeChild(launcher);
  });

  it("inits one vs-texthd", function() {
    expect(document.querySelectorAll('vs-texthd').length).to.equal(1);
  });

  it("inits vs-texthd with default config", function() {
    var vsTest = document.querySelector('vs-texthd');
    expect( vsTest.getAttribute('data-config') ).to.equal( '{"test": "initial-config"}' );
  });

  it("child -> launcher, launcher fires 'setAttributes' event when child changes config by itself", function(done) {
    var newConfig = {"test": "changed"};

    launcher.addEventListener('setAttributes', function(payload){
      var detail = payload.detail;
      expect(detail).to.deep.equal(newConfig);
      expect(launcher.config).to.deep.equal(newConfig);
      done();
    }, false);

    var vsTest = document.querySelector('vs-texthd');
    vsTest.setAttribute('data-config', JSON.stringify(newConfig));
  });

  it("launcher -> child, passes data-config to vs-texthd when the launcher changes its config", function(done) {
    var newConfig = {"test": "changed"};

    var vsTest = document.querySelector('vs-texthd');
    vsTest.attributeChangedCallback = function(attrName, oldVal, newVal){
      expect( JSON.parse(newVal) ).to.deep.equal(newConfig);
      done();
    };

    launcher.setAttribute('data-config', JSON.stringify(newConfig));
  });

  it("launcher -> child, launcher should NOT re-trigger 'setAttributes' when the launcher changes its config", function(done) {
    var errTimeout = setTimeout(function(){
      expect(true).to.equal(true, 'this should be invoked when tests are passing');
      done();
    }, 100);

    var newConfig = {"test": "changed"};

    launcher.addEventListener('setAttributes', function(){
      clearTimeout(errTimeout);
      expect(false).to.equal(true, 'setAttributes should NOT be fired');
      done();
    }, false);

    launcher.setAttribute('data-config', JSON.stringify(newConfig));
  });

  it("launcher -> child, passes editable to vs-texthd", function(done) {
    var vsTest = document.querySelector('vs-texthd');
    vsTest.attributeChangedCallback = function(attrName, oldVal, newVal){
      expect( attrName ).to.equal('editable');
      expect( oldVal ).to.equal(null);
      expect( newVal ).to.equal('true');
      done();
    };

    launcher.setAttribute('editable', 'true');
  });

  it("launcher -> child, passes non-editable to vs-texthd", function(done) {
    var vsTest = document.querySelector('vs-texthd');
    launcher.setAttribute('editable', 'true');

    vsTest.attributeChangedCallback = function(attrName, oldVal, newVal){
      expect( attrName ).to.equal('editable');
      expect( oldVal ).to.equal('true');
      expect( newVal ).to.equal(null);
      done();
    };

    launcher.removeAttribute('editable');
  });
});
