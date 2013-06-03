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
 * This is an extreme proof-of-concept. !included(Batteries || Warranty).
 */

var fs   = require('fs')
  , path = require('path')
  , _    = require('lodash');

module.exports = (function (config) {

  function setReallyPermissiveHeaders (res) {
    var headers = {
      'Content-Type': 'application/json',
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
    res.end(data);
  }

  // Mock lesson data to use in API responses
  function lesson () {
    var lesson = require(path.join(config.apiFixturesDir, 'lesson.json'));
    _.extend(lesson, { gadgets: lessonGadgets() });
    return lesson;
  }

  // Mock course data to use in API responses
  function course () {
    var course = require(path.join(config.apiFixturesDir, 'course.json'));
    _.extend(course, { isEditable: true, lessons: [lesson()] })
    return course;
  }

  // Mock course progress to use in api response
  function courseProgress () {
    return {};
  }

  // Mock gadget collection data to use in API responses
  function lessonGadgets () {
    return [{
      id: 1,
      type: gadget().type,
      config: gadgetConfig(),
      userState: gadgetUserState()
    }];
  }

  // Mock gadget data to use in API responses
  function gadget () {
    var gadget, manifest, manifestPath;
   
    manifestPath = path.join(config.gadgetDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error('Failed locating manifest (not in a gadget directory?)');
    }

    // TODO: run tests before sending results?
    manifest = require(manifestPath);

    gadget = {
      "id": 1,
      "name": manifest.name,
      "title": manifest.title,
      "version": manifest.version,
      "type": "gadget/" + manifest.name,
      "catalog": "approved",
      "icon": "http://localhost:3000/api/dev/assets/icon.png",
      "css": "http://localhost:3000/api/dev/assets/gadget.css",
      "files": {
        "gadget.js": "/dev/gadget.js",
        "gadget.css": "/dev/gadget.css",
        "assets/icon.png": "/dev/assets/icon.png"
      }
    };

    return gadget;
  }

  // Mock gadget config to use in API response
  function gadgetConfig () {
    // TODO: stuff in developer-specified data
    return {};
  }

  // Mock gadget userState to use in API response
  function gadgetUserState () {
    // TODO: stuff in developer-specified data
    return {};
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

  // Player bridge
  // TODO: 
  //  * handle POST/PUT/DELETE for adding gadgets and changing config/userState
  //  * beef up (/ integrate with beefed up) local fixture data, or...
  //  * proxy requests to "real" API
  function bridge (req, res, next) {
   
    // declare some resources
    var resource, resources = {
      'gadgets': [gadget()],
      'courses/1': course(),
      'courses/1/progress': courseProgress(),
      'lessons/1': lesson(),
      'courses/1/lessons/1': lesson(),
      'courses/1/lessons/1/gadgets': lessonGadgets(),
      'courses/1/lessons/1/gadgets/1/config': gadgetConfig(),
      'courses/1/lessons/1/gadgets/1/userstate': gadgetUserState()
    };

    if (req.url.indexOf('/api/dev/') == 0) {
      setReallyPermissiveHeaders(res); // assets need access-control-*, too!
      req.url = req.url.substr(8);
      next();
    }
    else if (req.url.indexOf('/api/') == 0) {
      resource = req.url.substr(5);           // strip ^/api/
      resource = resource.split('?').shift(); // strip query string
      if (resources.hasOwnProperty(resource)) {
        sendApiResponse(res, JSON.stringify(resources[resource])); 
      }
      else {
        console.log('resource not found', resource);
        res.end('not found');
      }
    }
    else {
      next();
    }
  }

  return bridge;

})({
  apiFixturesDir: '../../api2/test/fixtures',
  gadgetDir: process.cwd()
});

