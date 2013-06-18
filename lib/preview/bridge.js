(function() {
  var Bridge, express, fs, glob, path, sdkFixtures, sdkSite, shortid, _;

  express = require('express');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  glob = require('glob');

  shortid = require('shortid');

  sdkSite = path.join(__dirname, '../../preview');

  sdkFixtures = path.join(__dirname, '../../preview/fixtures');

  module.exports = Bridge = (function() {
    function Bridge(options) {
      var api,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (!options.port) {
        throw new Error('port has to be specified');
      }
      this.url = "http://localhost:" + options.port;
      this.gadgets = [];
      this.app = express();
      api = express();
      api.use(express.bodyParser());
      api.get('/courses/:id', function(req, res) {
        return res.sendfile(path.join(sdkFixtures, 'course.json'));
      });
      api.get('/courses/:id/progress', function(req, res) {
        return res.send({});
      });
      api.get('/courses/:id/lessons', function(req, res) {
        var course;
        course = JSON.parse(fs.readFileSync(path.join(sdkFixtures, 'course.json')));
        return res.send(course.lessons);
      });
      api.get('/courses/:course_id/lessons/:lesson_id', function(req, res) {
        var course, lesson, lesson_id;
        course = JSON.parse(fs.readFileSync(path.join(sdkFixtures, 'course.json')));
        lesson_id = parseInt(req.params['lesson_id']);
        lesson = _.find(course.lessons, function(lesson) {
          return lesson.id === lesson_id;
        });
        return res.send(lesson);
      });
      api.get('/gadgets', function(req, res) {
        if (req.param('catalog') === 'sandbox') {
          return res.send(_this.gadgets);
        } else {
          return res.send([]);
        }
      });
      api.put('/courses/:id/progress', function(req, res) {
        return res.send(200);
      });
      api.post('/courses/:id/lessons', function(req, res) {
        return res.send(201);
      });
      api.put('/courses/:id/lessons/:lesson_id', function(req, res) {
        return res.send(200);
      });
      api["delete"]('/courses/:id/lessons/:lesson_id', function(req, res) {
        return res.send(200);
      });
      api.post('/courses/:id/lessons/:lesson_id/gadgets', function(req, res) {
        return res.send(201);
      });
      api.put('/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', function(req, res) {
        return res.send(200);
      });
      api["delete"]('/courses/:id/lessons/:lesson_id/gadgets/:gadget_id', function(req, res) {
        return res.send(200);
      });
      api.put('/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/config', function(req, res) {
        return res.send(200);
      });
      api.put('/courses/:id/lessons/:lesson_id/gadgets/:gadget_id/userstate', function(req, res) {
        return res.send(200);
      });
      this.app.use(express["static"](sdkSite));
      this.app.use('/api', api);
    }

    Bridge.prototype.addGadget = function(gadgetPath) {
      var manifest, manifestPath;
      manifestPath = path.join(gadgetPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        return;
      }
      manifest = JSON.parse(fs.readFileSync(manifestPath));
      if (!manifest.id) {
        manifest.id = shortid.generate();
      }
      manifest.type = "gadget/" + manifest.id;
      manifest.catalog = 'sandbox';
      manifest.icon = "" + this.url + "/gadgets/" + manifest.id + "/assets/icon.png";
      if (!manifest.files) {
        manifest.files = this.getFiles(manifest.id, gadgetPath);
      }
      this.app.use("/gadgets/" + manifest.id, express["static"](gadgetPath));
      return this.gadgets.push(manifest);
    };

    Bridge.prototype.getFiles = function(id, gadgetPath) {
      var assets, files;
      files = {
        'gadget.js': "" + this.url + "/gadgets/" + id + "/gadget.js",
        'gadget.css': "" + this.url + "/gadgets/" + id + "/gadget.css"
      };
      assets = glob.sync('*.*', {
        cwd: path.join(gadgetPath, 'assets')
      });
      _.each(assets, function(asset) {
        return files[asset] = asset;
      });
      return files;
    };

    return Bridge;

  })();

}).call(this);
