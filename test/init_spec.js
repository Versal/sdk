var mocha = require("mocha"),
    chai = require("chai"),
    init = require("./../lib/commands/init"),
    should = chai.should(),
    path = require('path');

describe("Init", function(){
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
      var options = { template_path: './test/fixtures/template', sdk_path: 'invalid_path', gadget_path: '.' };
      (function(){ init(options); }).should.Throw(/SDK not found/);
    });

    it("should not fail if gadget_path doesn't exists", function(){
      var options = { template_path: './test/fixtures/template', sdk_path: './test/fixtures/sdk', gadget_path: '.' };
      (function(){ init(options); }).should.Throw(/SDK not found/);
    })
  });
});
