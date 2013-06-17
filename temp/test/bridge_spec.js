(function() {
  var Bridge, Helper, fs, helper, path, request, sdk;

  require('chai').should();

  request = require('superagent');

  fs = require('fs');

  path = require('path');

  sdk = require('../../lib/sdk2');

  Bridge = require('../../lib/preview/bridge');

  Helper = (function() {
    function Helper() {}

    Helper.prototype.url = "http://localhost:3073";

    Helper.prototype.port = 3073;

    Helper.prototype.getApiUrl = function(endpoint) {
      return "" + this.url + "/api/" + endpoint;
    };

    Helper.prototype.getFixture = function(fixture) {
      return JSON.parse(fs.readFileSync("./preview/fixtures/" + fixture + ".json", 'utf-8'));
    };

    return Helper;

  })();

  helper = new Helper();

  describe('Bridge', function() {
    before(function() {
      this.bridge = new Bridge({
        port: helper.port
      });
      return this.bridge.app.listen(helper.port);
    });
    it('should set correct apiUrl', function() {
      return helper.getApiUrl('whatever').should.eq("http://localhost:3073/api/whatever");
    });
    it('should return index', function(done) {
      return request.get(helper.url).end(function(res) {
        res.ok.should.be.ok;
        return done();
      });
    });
    it('should return empty progress', function(done) {
      return request.get(helper.getApiUrl('courses/1/progress')).end(function(res) {
        res.body.should.eql({});
        return done();
      });
    });
    describe('course', function() {
      it('should serve course.json from sdk/fixtures folder', function(done) {
        return request.get(helper.getApiUrl('courses/1')).end(function(res) {
          res.body.should.eql(helper.getFixture('course'));
          return done();
        });
      });
      it('should serve lessons', function(done) {
        return request.get(helper.getApiUrl('courses/1/lessons')).end(function(res) {
          res.body.length.should.eq(2);
          return done();
        });
      });
      return it('should serve lesson', function(done) {
        return request.get(helper.getApiUrl('courses/1/lessons/1')).end(function(res) {
          res.body.id.should.eq(1);
          return done();
        });
      });
    });
    return describe('gadgets', function() {
      describe('sandbox', function() {
        before(function(done) {
          var params;
          this.gadgets = [];
          params = {
            user: 'me',
            catalog: 'sandbox'
          };
          return request.get(helper.getApiUrl('gadgets')).send(params).end(function(res) {
            this.gadgets = res.body;
            return done();
          });
        });
        return it('should serve gadgets from .versal folder', function() {
          return this.gadgets.should.eql([]);
        });
      });
      describe('pending', function() {
        before(function(done) {
          var params;
          this.gadgets = [];
          params = {
            user: 'me',
            catalog: 'pending'
          };
          return request.get(helper.getApiUrl('gadgets')).send(params).end(function(res) {
            this.gadgets = res.body;
            return done();
          });
        });
        return it('should return empty array', function() {
          return this.gadgets.should.eql([]);
        });
      });
      return describe('add', function() {
        before(function(done) {
          var _this = this;
          this.gadgetPath = path.resolve('./temp/gadgets/bridge_gadget');
          return sdk.create(this.gadgetPath, function() {
            var params;
            _this.bridge.addGadget(_this.gadgetPath);
            params = {
              user: 'me',
              catalog: 'sandbox'
            };
            return request.get(helper.getApiUrl('gadgets')).send(params).end(function(res) {
              _this.gadgets = res.body;
              return done();
            });
          });
        });
        it('should return new gadget from sandbox', function() {
          return this.gadgets.length.should.eq(1);
        });
        it('should set files hash on manifest', function() {
          return this.gadgets[0].files.should.be.ok;
        });
        return it('should serve gadget files from /gadgets/:id folder', function(done) {
          var gadget, url;
          gadget = this.gadgets[0];
          url = "" + helper.url + "/gadgets/" + gadget.id + "/gadget.js";
          return request.get(url).end(function(res) {
            res.status.should.eq(200);
            return done();
          });
        });
      });
    });
  });

}).call(this);
