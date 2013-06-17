(function() {
  var fs, gadgetPath, glob, path, sdk;

  require('chai').should();

  path = require('path');

  glob = require('glob');

  fs = require('fs');

  sdk = require('../../lib/sdk2');

  gadgetPath = path.resolve('./temp/gadgets');

  describe('Compile', function() {
    before(function(done) {
      return sdk.create("" + gadgetPath + "/g5", function() {
        return sdk.compile("" + gadgetPath + "/g5", function(err) {
          if (err) {
            throw err;
          }
          return done();
        });
      });
    });
    describe('dist folder', function() {
      it('should exist', function() {
        return fs.existsSync("" + gadgetPath + "/g5/dist").should.be["true"];
      });
      it('should contain assets', function() {
        var assets;
        assets = glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g5/assets"
        });
        return glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g5/dist/assets"
        }).should.eql(assets);
      });
      return it('should have standard files', function() {
        var standardFiles;
        standardFiles = ['gadget.css', 'gadget.js', 'manifest.json'];
        return glob.sync('*.*', {
          cwd: "" + gadgetPath + "/g5/dist"
        }).should.eql(standardFiles);
      });
    });
    return describe('code', function() {
      return it('should equal standard gadget', function() {
        var standardCode, standardPath;
        standardPath = path.resolve('./test/fixtures/compile/static_compiled.js');
        standardCode = fs.readFileSync(standardPath, 'utf-8');
        return fs.readFileSync("" + gadgetPath + "/g5/dist/gadget.js", 'utf-8').should.eql(standardCode);
      });
    });
  });

}).call(this);
