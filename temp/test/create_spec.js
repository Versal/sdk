(function() {
  var create, fs, gadgetPath, glob, path, should;

  should = require('chai').should();

  path = require('path');

  glob = require('glob');

  create = require('../../lib/create/create');

  fs = require('fs');

  gadgetPath = path.resolve('./temp/gadgets');

  describe('Create', function() {
    before(function() {
      return this.templateFiles = glob.sync('**/*.*', {
        cwd: path.resolve('./templates/static')
      });
    });
    describe('single gadget', function() {
      before(function(done) {
        return create("" + gadgetPath + "/g1", done);
      });
      return it('should copy template files for g1', function() {
        return glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g1"
        }).should.eql(this.templateFiles);
      });
    });
    describe('multiple gadgets', function() {
      before(function(done) {
        return create(["" + gadgetPath + "/g2"], function() {
          return create(["" + gadgetPath + "/g3", "" + gadgetPath + "/g4"], function() {
            return done();
          });
        });
      });
      it('should copy template files for g2', function() {
        return glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g2"
        }).should.eql(this.templateFiles);
      });
      it('should copy template files for g3', function() {
        return glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g3"
        }).should.eql(this.templateFiles);
      });
      return it('should copy template files for g4', function() {
        return glob.sync('**/*.*', {
          cwd: "" + gadgetPath + "/g4"
        }).should.eql(this.templateFiles);
      });
    });
    return describe('in folder with files', function() {
      return it('should throw if run on non-empty folder', function(done) {
        return create("" + gadgetPath + "/g1", function(err) {
          err.should.be.ok;
          return done();
        });
      });
    });
  });

}).call(this);
