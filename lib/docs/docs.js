(function() {
  var connect, http, path;

  connect = require('connect');

  http = require('http');

  path = require('path');

  module.exports = {
    command: function(dirs, options, callback) {
      var app, docsPath, port, url;
      if (callback == null) {
        callback = function() {};
      }
      docsPath = path.join(__dirname, '..', '..', 'docs');
      port = options.port || 4000;
      url = "http://localhost:" + port;
      app = connect().use(connect["static"](docsPath));
      http.createServer(app).listen(port);
      console.log('');
      console.log(" \\ \\/ /  Starting docs server on " + url);
      console.log("  \\/ /   Press Ctrl + C to exit...");
      return callback();
    }
  };

}).call(this);
