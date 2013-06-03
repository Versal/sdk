var mocha = require("mocha"),
    chai = require("chai"),
    fs = require("fs"),
    path = require("path"),
    sdk = require("../lib/sdk");

chai.should();

describe('Gadget wrapper', function(){
  before(function(){
    this.text = fs.readFileSync(path.resolve("./test/fixtures/wrapper/gadget.js"));
  });

  describe('extract dependencies', function(){
    before(function(){
      this.deps = sdk.extractDeps(this.text);
    })

    it('should extract cdn.backbone and cdn.jquery', function(){
      this.deps.should.eql(['cdn.backbone', 'cdn.jquery']);
    })
  })

  describe('wrap code with deps', function(){
    before(function(){
      this.deps = sdk.extractDeps(this.text);
      this.wrapped = sdk.wrapCode('', this.deps);
    })

    it('should start with define', function(){
      this.wrapped.indexOf('define([\'cdn.backbone\',\'cdn.jquery\'], function(){').should.eq(0);
    });

    it('should contain cdn definition', function(){
      this.wrapped.indexOf('var cdn = {};').should.be.gt(0);
    });

    it('should set cdn.backbone', function(){
      this.wrapped.indexOf('cdn.backbone = arguments[0];').should.be.gt(0);
    })

    it('should contain define for cdn.backbone', function(){
      this.wrapped.indexOf('define(\'cdn.backbone\', [], function(){ return cdn.backbone })').should.be.gt(0);
    });

    it('should contain define for cdn.jquery', function(){
      this.wrapped.indexOf('define(\'cdn.jquery\', [], function(){ return cdn.jquery })').should.be.gt(0);
    });
  })

  describe('wrap code without deps', function(){
    before(function(){
      this.wrapped = sdk.wrapCode('');
    });

    it('should not contain cdn', function(){
      this.wrapped.indexOf('var cdn').should.eq(-1);
    });

    it('should wrap into define', function(){
      this.wrapped.indexOf('define([], function(){').should.eq(0);
    })
  })
});