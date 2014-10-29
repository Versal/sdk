// for versal-legacy-launcher
window.require = function(dependencies, callback) {
  if (dependencies.length === 1 && dependencies[0] === '/base/legacy-launcher/test_gadget/gadget.js') {
    callback(function(gadgetOptions) {
      window.gadgetOptions = gadgetOptions;
    });
  } else {
    chai.expect(dependencies).to.deep.equal(['cdn.underscore', 'cdn.backbone', 'cdn.jquery']);
    callback(_, Backbone, $);
  }
};

