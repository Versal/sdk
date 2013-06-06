/**
* Provides a fake API for previewing the current gadget in player. Run preview
* and point local player to http://localhost:3000/api.
*
*     window.Player = new PlayerApplication({
*       container: '.player-container',
*       courseId: 1,
*       api: {
*         apiUrl: 'http://localhost:3000/api',
*         sessionId: 'not_used'
*       }
*     });
*
* This is a prototype. !included(Batteries || Warranty).
**/

var fs   = require('fs')
  , path = require('path')
  , _    = require('lodash');

module.exports = (function (sdk, config) {

  // Retrieve the named JSON from sdk/fixtures
  function fixture (file) {
    var content,
        file = path.join(__dirname, 'fixtures', file);

    if (!fs.existsSync(file)) {
      return null;
    }

    return require(file);
  }

  function setReallyPermissiveHeaders (res) {
    var headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, SESSION_ID, API_KEY',
      'Access-Control-Expose-Headers': 'Content-Type, SESSION_ID, User-id'
    };

    _.each(headers, function (val, key) {
      res.setHeader(key, val);
    });
  }

  // Check it, I'm an API response!
  function sendApiResponse (res, data) {
    setReallyPermissiveHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    res.end(data);
  }

  // Mock assets data to use in API responses
  function assets () {
    var content = fixture('assets.json');
    return content ? content.image : []; // video to come later
  }

  // Mock lesson data from lessonGadgets
  function lessonFactory (lessonGadgets) {
    var lesson = fixture('lesson.json');
    _.extend(lesson, { gadgets: lessonGadgets || [] });
    return lesson;
  }

  // Mock course data to use in API responses
  function courseFactory (lesson) {
    var course = fixture('course.json');
    _.extend(course, { isEditable: true, lessons: [lesson] })
    return course;
  }

  // Mock course progress to use in api response
  function courseProgress () {
    return {};
  }

  // Mock gadget collection from gadgets
  function lessonGadgetsFactory (gadgets) {
    return _.map(gadgets, function(gadget){
      return {
        id: 1,
        type: gadget.type,
        config: gadgetConfig(),
        userState: gadgetUserState()
      };
    });
  }

  // Mock gadget data to use in API responses
  id = 0
  function gadgetFactory (gadgetPath) {
    var gadget, manifest, manifestPath;
    if (gadgetPath) {
      // gadget is compiled and we know its path
      manifestPath = path.join(gadgetPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        manifest = require(manifestPath);
      }
    } else {
      gadgetPath = "";
      manifestPath = path.join(process.cwd(), 'manifest.json')
      if (!fs.existsSync(manifestPath)) {
        console.log('Running preview, not in a gadget directory, so only compiled results will show');
        return null;
      }
      manifest = require(manifestPath);
    }

    // TODO: run tests before sending results?
    gadget = {
      "id": id++,
      "name": manifest.name,
      "title": manifest.title,
      "version": manifest.version,
      "type": "gadget/" + manifest.name,
      "defaultConfig": manifest.defaultConfig || {},
      "catalog": "approved",
      "icon": "http://localhost:"+config.port+gadgetPath+"/assets/icon.png",
      "css": "http://localhost:"+config.port+gadgetPath+"/assets/gadget.css",
      "files": {
        "gadget.js": "http://localhost:"+config.port+gadgetPath+"/gadget.js",
        "gadget.css": "http://localhost:"+config.port+gadgetPath+"/gadget.css",
        "assets/icon.png": "http://localhost:"+config.port+gadgetPath+"/assets/icon.png"
      }
    };

    return gadget;

  }

  // Mock gadget config to use in API response
  function gadgetConfig () {
    var content = fixture('config.json');
    return content ? content : {}; // video to come later
  }

  // Mock gadget userState to use in API response
  function gadgetUserState () {
    var content = fixture('userstate.json');
    return content ? content : {}; // video to come later
  }

  // Pipe an asset file
  function serveAsset (res, asset) {

    var stream,
        file = path.join(__dirname, '/fake_assets/' + asset);

    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('/api/assets/' + asset);
    }
    else {
      res.writeHead(200, {
        'Content-type' : 'image/png',
        'Content-Length' : fs.statSync(file).size
      });

      stream = fs.createReadStream(file);
      stream.pipe(res);
    }
  }

  // Resolve a data source into JSON data
  // data is one of string filename, Object literal, or Array literal
  function resolveData (data) {
    if (_.isString(data)) {
      return fs.readFileSync(path.resolve(__dirname, data));
    }
    else if (_.isObject(data) || _.isArray(data)) {
      return JSON.stringify(data);
    }
    else {
      throw new Error('Only objects, arrays, and filenames are valid data sources');
    }
  };

  function createResourceMap () {

    // declare some resources
    var resources = {
      'assets': assets(),
      'gadgets': [],
      'courses/1/progress': courseProgress()
    };

    // preview local gadget
    var previewGadget = gadgetFactory();
    var omitPath;
    if (previewGadget !== null) {
      omitPath = config.currentDir;
      previewGadget.catalog = "pending";
      resources.gadgets.push(previewGadget);
    }

    // load gadgets from registry
    data =  fs.readFileSync(path.join(sdk.getHomeDirectory(),'.versal'), "utf8");
    var json = JSON.parse(data);
    _.forEach(json["gadgets"], function(dir){
      if (dir !== omitPath) {
        // ensure gadgets are compiled
        manifestPath = path.join(path.join(dir, "dist"), 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
          sdk.compile({src:dir, dist:path.join(dir, "dist")}, function(){
            var g = gadgetFactory(path.join(dir,"dist"));
            resources.gadgets.push(g);
          });
        } else {
          var g = gadgetFactory(path.join(dir,"dist"));
          resources.gadgets.push(g);
        }
        // config and userstate not currently implemented
        //resources['courses/1/lessons/1/gadgets/'+g.id+'/config'] = gadgetConfig();
        //resources['courses/1/lessons/1/userstate/'+g.id+'/userstate'] = gadgetConfig();
      }
    });
    var lg = lessonGadgetsFactory(resources.gadgets);
    resources['courses/1/lessons/1/gadgets'] = lg;
    var l = lessonFactory(lg);
    resources['lessons/1'] = l;
    resources['courses/1/lessons/1'] = l;
    resources['courses/1'] = courseFactory(l);

    return resources;
  }

  // store this globally in module - might be able to persist course through
  // refresh on this.
  var resources = createResourceMap();

  // Player bridge
  // TODO:
  //  * handle POST/PUT/DELETE for adding gadgets and changing config/userState
  //  * beef up (/ integrate with beefed up) local fixture data, or...
  //  * proxy requests to "real" API
  function bridge (req, res, next) {
    if (req.url.indexOf('/api/dev/') == 0) {
      setReallyPermissiveHeaders(res); // assets need access-control-*, too!
      req.url = req.url.substr(8);
      next();
    }
    else if (req.url.indexOf('/api/asset_representations/') == 0) {
      serveAsset(res, req.url.substr('/api/asset_representations/'.length));
    }
    else if (req.url.indexOf('/api/') == 0) {
      var resource = req.url.substr(5);           // strip ^/api/
      resource = resource.split('?').shift(); // strip query string
      if (resources.hasOwnProperty(resource)) {
        sendApiResponse(res, JSON.stringify(resources[resource]));
      }
      else {
        // TODO: Remove this check when we implement offline course-persistence
        if (!(resource.match(/config$/) || resource.match(/userstate$/) || resource.indexOf('courses/1/lessons/1/gadgets/') ==0)) {
          console.log('resource not found', resource);
        }
        res.end('not found');
      }
    }
    else {
      next();
    }
  }

  return bridge;

});

