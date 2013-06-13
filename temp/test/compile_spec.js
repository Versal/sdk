(function() {
  var compile, create, fs, gadgetPath, glob, path;

  require('chai').should();

  path = require('path');

  glob = require('glob');

  fs = require('fs');

  compile = require('../../lib/compile/compile');

  create = require('../../lib/create/create');

  gadgetPath = path.resolve('./temp/gadgets');

  describe('Compile', function() {
    return describe('single gadget', function() {
      before(function(done) {
        return create("" + gadgetPath + "/g5", function() {
          return compile("" + gadgetPath + "/g5", function() {
            return done();
          });
        });
      });
      it('should compile gadget into bundle folder', function() {
        return fs.existsSync("" + gadgetPath + "/g5/bundle").should.be["true"];
      });
      it('should copy assets', function() {
        var assets;
        assets = glob.sync('**/*.*', "" + gadgetPath + "/g5/assets");
        return glob.sync('**/*.*', "" + gadgetPath + "/g5/bundle/assets").should.eql(assets);
      });
      it('should have gadget.js and gadget.css', function() {
        console.log(glob.sync('*.*', "" + gadgetPath + "/g5/bundle"));
        return glob.sync('*.*', "" + gadgetPath + "/g5/bundle").should.eql(standardFiles);
      });
      return it('gadget.js should equal standard gadget.js', function() {
        var standardGadget;
        standardGadget = fs.readFileSync(path.resolve('./test/fixtures/compile/static_gadget_compiled.js'), 'utf-8');
        return fs.readFileSync("" + gadgetPath + "/g5/bundle/gadget.js", 'utf-8').should.eql(standardGadget);
      });
    });
  });

}).call(this);
