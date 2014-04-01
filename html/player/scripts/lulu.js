(function() {
  var VersalLauncher, allowedKeys,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  allowedKeys = ['course', 'sid', 'api', 'collabUrl', 'whitelabel', 'embed', 'noEditable', 'revision', 'sdk'];

  VersalLauncher = (function() {
    function VersalLauncher() {
      this._onMessage = __bind(this._onMessage, this);
    }

    VersalLauncher.prototype.launch = function(frameEl, options) {
      var _base;
      this.frameEl = frameEl;
      this.options = options != null ? options : {};
      this._listeners = {};
      this.options = this._sanitizeOptions();
      this.scriptEl = this._getScript();
      this.origin = this._getOrigin();
      this._prepareFrame();
      (_base = this.options).api || (_base.api = this._getApiUrl());
      window.addEventListener('message', this._onMessage);
      return this;
    };

    VersalLauncher.prototype.on = function(name, fn) {
      var _base;
      (_base = this._listeners)[name] || (_base[name] = []);
      return this._listeners[name].push(fn);
    };

    VersalLauncher.prototype.off = function(name, fn) {
      var i, listener, listeners, _i, _len, _results;
      listeners = this._listeners[name];
      if (!listeners) {
        return;
      }
      _results = [];
      for (i = _i = 0, _len = listeners.length; _i < _len; i = ++_i) {
        listener = listeners[i];
        if (listener === fn) {
          _results.push(listeners.splice(i, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    VersalLauncher.prototype.trigger = function() {
      var args, listener, name, _i, _len, _ref, _results;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!this._listeners[name]) {
        return;
      }
      _ref = this._listeners[name];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        _results.push(listener.apply(this, args));
      }
      return _results;
    };

    VersalLauncher.prototype._getApiUrl = function() {
      var base;
      base = this.origin.split('/').slice(0, 3).join('/');
      return "" + base + "/api2";
    };

    VersalLauncher.prototype._sanitizeOptions = function() {
      var key, options, _i, _len;
      options = {};
      for (_i = 0, _len = allowedKeys.length; _i < _len; _i++) {
        key = allowedKeys[_i];
        if (this.options[key]) {
          options[key] = this.options[key];
        }
      }
      return options;
    };

    VersalLauncher.prototype._getScript = function() {
      var scripts;
      scripts = this._getScripts();
      if (scripts.length > 1) {
        throw new Error("`lulu.js` should only be loaded once");
      } else {
        return scripts.pop();
      }
    };

    VersalLauncher.prototype._getScripts = function() {
      var scripts, _i, _len, _ref, _scriptEl;
      scripts = [];
      _ref = document.getElementsByTagName('script');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _scriptEl = _ref[_i];
        if (_scriptEl.src.indexOf('lulu.js') > 0) {
          scripts.push(_scriptEl);
        }
      }
      return scripts;
    };

    VersalLauncher.prototype._getOrigin = function() {
      var _ref;
      return ((_ref = this.scriptEl.src.match(/^(https?:\/\/.+)\/scripts\/lulu.js/)) != null ? _ref[1] : void 0) || window.location.origin;
    };

    VersalLauncher.prototype._launchPlayer = function(playerWindow) {
      this.send(playerWindow, 'player:launch', this.options);
      return this.trigger('ready');
    };

    VersalLauncher.prototype.send = function(toWindow, eventName, payload) {
      this.options.event = eventName;
      return toWindow.postMessage(JSON.stringify(payload), this.origin);
    };

    VersalLauncher.prototype._prepareFrame = function() {
      var parentEl;
      this.frameEl.src = this.origin + '/iframe.html';
      this.frameEl.className = "versal-embed-" + this.options.course + " " + this.frameEl.className;
      this.frameEl.style.border = '0';
      this.frameEl.style.minWidth = '750px';
      this.frameEl.marginheight = '0';
      parentEl = this.frameEl.parentNode;
      return this.frameEl.height = parentEl.offsetHeight + 'px';
    };

    VersalLauncher.prototype._onMessage = function(e) {
      var eventName;
      if (this.origin.indexOf(e.origin) !== 0) {
        return;
      }
      try {
        eventName = JSON.parse(e.data).event;
        if (eventName === 'player:ready') {
          this._launchPlayer(e.source);
        }
        this.trigger(eventName);
        if (window.parent !== window) {
          return window.parent.postMessage(e.data, '*');
        }
      } catch (_error) {
        e = _error;
      }
    };

    return VersalLauncher;

  })();

  window.$v = new VersalLauncher;

}).call(this);
