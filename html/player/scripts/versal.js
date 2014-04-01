(function() {
  var AUTHOR_WIDTH, IFRAME_CLASS_NAME, LEARNER_WIDTH, c, config, deprecationNotice, extractData, found, origin, playerFrame, _i, _len, _ref;

  IFRAME_CLASS_NAME = 'versal-embed';

  LEARNER_WIDTH = '750px';

  AUTHOR_WIDTH = '1500px';

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
      minWidth: LEARNER_WIDTH,
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
    _ref = ['course', 'sid', 'api', 'whitelabel', 'embed', 'noEditable', 'revision'];
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

  window.addEventListener('message', function(evt) {
    var data, e, _ref;
    try {
      data = JSON.parse(evt.data);
      if (data.event === 'player:loaded' && ((_ref = data.course) != null ? _ref.isEditable : void 0)) {
        return document.querySelector("." + IFRAME_CLASS_NAME).style.minWidth = AUTHOR_WIDTH;
      }
    } catch (_error) {
      e = _error;
    }
  });

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
      playerFrame(c.parentNode, origin + '/iframe.html', IFRAME_CLASS_NAME);
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
