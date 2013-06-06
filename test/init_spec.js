var mocha = require("mocha"),
    chai = require("chai"),
    should = chai.should(),
    path = require('path'),
    fs = require('fs'),
    fse = require('fs-extra'),
    ncp = require('ncp'),
    _ = require('lodash'),
    glob = require('glob');

var initializer = require("./../lib/commands/init"),
    init = initializer.initialize;

before(function(){
  fse.removeSync('./test/gadgets');
  fs.mkdirSync('./test/gadgets');
});

after(function(){
  fse.removeSync('./test/gadgets');
})

describe("Init command", function(){
  describe("Options", function(){
    it("should fail if template_path is not specified", function(){
      var options = { test: true };
      (function(){ init(options); }).should.Throw(/template_path option is required/);
    })

    it("should fail if sdk_path is not specified", function(){
      var options = { test: true, template_path: '.' };
      (function(){ init(options); }).should.Throw(/sdk_path option is required/);
    })

    it("should fail if template_path is not specified", function(){
      var options = { test: true, template_path: '.', sdk_path: '.' };
      (function(){ init(options); }).should.Throw(/gadget_path option is required/);
    })

    it("should pass if template_path, sdk_path and gadget_path are specified", function(){
      var options = { test: true, template_path: '.', sdk_path: '.', gadget_path: '.' };
      (function(){ init(options); }).should.not.Throw();
    })
  })

  describe("Invalid paths",function(){
    it("should fail if template_path does not exist", function(){
      var options = { test: true, template_path: 'invalid_path', sdk_path: '.', gadget_path: '.' };
      (function(){ init(options); }).should.Throw(/Template not found/);
    });

    it("should fail if sdk path_does not exist", function(){
      var options = { test: true, template_path: path.resolve('./test/fixtures/template'), sdk_path: 'invalid_path', gadget_path: '.' };
      (function(){ init(options); }).should.Throw(/SDK not found/);
    });

    it("should not fail if gadget_path doesn't exists", function(){
      var options = { test: true, template_path: path.resolve('./test/fixtures/template'), sdk_path: path.resolve('./test/fixtures/sdk'), gadget_path: '.' };
      (function(){ init(options); }).should.not.Throw();
    })
  });

  describe("ncp copying", function(){
    var target_path = path.resolve('./test/gadgets/gadget');
    var template_path = path.resolve('./test/fixtures/template');
    var originalFiles = glob.sync("**", { cwd: template_path });

    beforeEach(function(){
      fse.removeSync('./test/gadgets/gadget');
    })

    it("should copy files from one folder to another", function(done){
      ncp(template_path, target_path, function(){
        glob("**", { cwd: target_path }, function(err, files){
          files.should.eql(originalFiles);
          done();
        })
      })
    })

    it("should copy files from one folder to another", function(done){
      ncp(template_path, target_path, function(){
        ncp(template_path, target_path, function(){
          glob("**", { cwd: target_path }, function(err, files){
            files.should.eql(originalFiles);
            done();
          })
        })
      })
    })

    it("should copy files from one folder to another", function(done){
      ncp(template_path, target_path, function() {
        process.nextTick(function(){
          ncp(template_path, target_path, { clobber: false }, function(){
            glob("**", { cwd: target_path }, function(err, files){
              files.should.eql(originalFiles);
              done();
            })
          })
        });
      })
    })
  })

  describe("Copying files", function(){
    beforeEach(function(){
        fse.removeSync('./test/gadgets/gadget');
    });

    var options = { template_path: path.resolve('./test/fixtures/template'), sdk_path: path.resolve('./test/fixtures/sdk'), gadget_path: path.resolve('./test/gadgets/gadget') };
    var requiredFiles = _.map(['b','c/d'], function(f){ return path.join(options.gadget_path, f); });

    it("should not copy ignoredFiles from template folder", function(done){
      init(options, function(err){
        fs.existsSync(requiredFiles[0]).should.be.true;
        fs.existsSync(path.join(options.gadget_path, 'package.json')).should.be.false;
        done();
      })
    })

    it("should copy files from template and sdk folders into gadget folder", function(done){
      var expected = { a: 'a', b: 'b', d: 'd' };
      init(options, function(err){
        _.forEach(requiredFiles, function(f){ fs.readFileSync(f, "utf8").should.equal(expected[path.basename(f)]); });
        done();
      })
    })

    it("should create a clean copy if --clean==true", function(done){
      init(options, function(err){ 
        fs.writeFileSync(path.join(options.gadget_path, 'b'), 'bbb');
        fs.appendFileSync(path.join(options.gadget_path, 'f'), 'fff');
        var opts = _.extend(_.clone(options), { clean: true });

        init(opts, function(err){
          var expected = { a: 'a', b: 'b', d: 'd' };
          _.forEach(requiredFiles, function(f){ fs.readFileSync(f, "utf8").should.equal(expected[path.basename(f)]); });
          fs.existsSync(path.join(options.gadget_path, 'f')).should.be.false;
          done();
        })
      });
    })
  })
});
