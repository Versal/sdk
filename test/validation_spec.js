var mocha = require("mocha"),
    chai = require("chai");

chai.should();

var validator = require("./../lib/tasks/validate");

describe("validation", function(){
  describe("manifest", function(){
    var validManifest = {
      name: "foo-gadget",
      version: "0.1.2",
      description: "Foo gadget."
    };

    var brokenManifest = {
      name: "foo gadget",
      version: "latest"
    };

    it("should validate validManifest", function(){
      validator.validateManifest(validManifest).should.be.null;
    });

    it("should not validate brokenManifest", function(){
      validator.validateManifest(brokenManifest).length.should.equal(3);
    });
  });
});