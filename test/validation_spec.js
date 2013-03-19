var mocha = require("mocha"),
    chai = require("chai"),
    validator = require("./../lib/commands/validate");

chai.should();

describe("Validation", function(){

  describe("Manifest", function(){
    var validManifest = {
      name: "foo-gadget",
      version: "0.1.2",
      description: "Foo gadget."
    };

    var brokenManifest = {
      name: "foo gadget",
      version: "latest"
    };

    it("should return empty array for valid manifest", function(){
      validator.validateManifest(validManifest).length.should.equal(0);
    });

    it("should return errors for broken manifest", function(){
      validator.validateManifest(brokenManifest).length.should.equal(3);
    });
  });

  describe("Files", function(){
    var validFiles = ["manifest.json", "gadget.js", "gadget.css", "assets/icon.png", "assets/asset.png", "scripts/dependent.js"];
    var invalidFiles = [];

    it("should return empty array for valid files", function(){
      validator.validateFiles(validFiles).length.should.equal(0);
    })

    it("should return errors for invalid files", function(){
      validator.validateFiles(invalidFiles).length.should.equal(4);
    })
  });
});