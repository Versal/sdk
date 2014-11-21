(function() {
  var IFRAME_CLASS_NAME, c, config, deprecationNotice, extractData, found, origin, playerFrame, _i, _len, _ref;

  IFRAME_CLASS_NAME = 'versal-embed';

  playerFrame = function(el, url, className) {
    var attr, css, frame, key, val, _i, _len, _ref;
    frame = document.createElement('iframe');
    frame.src = url;
    frame.className = className;
    _ref = ['', 'webkit', 'moz'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attr = _ref[_i];
      frame.setAttribute("" + attr + "allowfullscreen", 'true');
    }
    css = {
      height: el.offsetHeight + 'px',
      border: '0',
      width: '100%',
      height: '100%'
    };
    for (key in css) {
      val = css[key];
      frame.style[key] = val;
    }
    frame.marginheight = '0';
    return el.appendChild(frame);
  };

  deprecationNotice = function(feature) {
    return ["WARNING: " + feature, "Please report this sighting to <support@versal.com>."].join('\n');
  };

  extractData = function(el) {
    var key, result, val, _i, _len, _ref;
    result = {};
    _ref = ['course', 'sid', 'api'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      val = el.getAttribute("data-" + key);
      if (val) {
        result[key] = val;
      }
    }
    result.fullscreen = el.getAttribute('data-fullscreen') === "true";
    return result;
  };

  _ref = document.getElementsByTagName('script');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    c = _ref[_i];
    found = false;
    if (c.src.indexOf('versal.js') > 0) {
      if (found) {
        throw new Error(deprecationNotice('Multiple courses are not supported'));
      }
      found = true;
      origin = c.src.match(/^(https?:\/\/.+)\/scripts\/versal.js/)[1];
      playerFrame(c.parentNode, origin + '/legacy-embed.html', IFRAME_CLASS_NAME);
      if (c.hasAttribute('data-sid')) {
        console.warn(deprecationNotice("data-* syntax is no longer supported and will be removed shortly."));
        config = extractData(c);
        window.addEventListener('message', function(evt) {
          if (origin.indexOf(evt.origin) !== 0) {
            return;
          }
          if (JSON.parse(evt.data).event === 'player:ready') {
            config.event = 'player:launch';
            return evt.source.postMessage(JSON.stringify(config), origin);
          } else {
            return window.parent.postMessage(evt.data, '*');
          }
        });
      }
    }
  }

}).call(this);
