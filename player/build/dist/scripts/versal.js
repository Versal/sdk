(function() {
  var c, data, extractData, launchPlayer, origin, playerFrame, _i, _len, _ref;

  playerFrame = function(el, url, className, fullscreen) {
    var css, frame, key, val;
    frame = document.createElement('iframe');
    frame.src = url;
    frame.className = className;
    css = fullscreen ? {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: '0',
      left: '0'
    } : {
      height: el.offsetHeight + 'px'
    };
    css['border'] = '0';
    css['minWidth'] = '750px';
    for (key in css) {
      val = css[key];
      frame.style[key] = val;
    }
    frame.marginheight = '0';
    return el.appendChild(frame);
  };

  extractData = function(c) {
    var key, result, val, _i, _len, _ref;
    result = {};
    _ref = ['course', 'sid', 'api', 'collabUrl', 'whitelabel', 'embed', 'noEditable', 'revision'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      val = c.getAttribute("data-" + key);
      if (val) {
        result[key] = val;
      }
    }
    result.fullscreen = c.getAttribute('data-fullscreen') === "true";
    return result;
  };

  _ref = document.getElementsByTagName('script');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    c = _ref[_i];
    if (c.src.indexOf('versal.js') > 0) {
      data = extractData(c);
      origin = c.src.match(/^(https?:\/\/.+)\/scripts\/versal.js/)[1];
      playerFrame(c.parentNode, origin + '/iframe.html', "versal-embed-" + data.course, data.fullscreen);
      if (data.hasOwnProperty('sid')) {
        launchPlayer = function(e) {
          data.event = 'player:launch';
          return e.source.postMessage(JSON.stringify(data), origin);
        };
        window.addEventListener('message', function(e) {
          if (origin.indexOf(e.origin) !== 0) {
            return;
          }
          switch (JSON.parse(e.data).event) {
            case 'player:ready':
              return launchPlayer(e);
            default:
              return window.parent.postMessage(e.data, '*');
          }
        });
      }
    }
  }

}).call(this);
