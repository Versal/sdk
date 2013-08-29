define(['cdn.jquery','cdn.underscore','cdn.backbone','cdn.jqueryui','cdn.backbone','cdn.jquery','cdn.underscore'], function(){
var cdn = {};
cdn.jquery = arguments[0];
cdn.underscore = arguments[1];
cdn.backbone = arguments[2];
cdn.jqueryui = arguments[3];
cdn.backbone = arguments[4];
cdn.jquery = arguments[5];
cdn.underscore = arguments[6];
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define('src/crop',['require','exports','module','backbone'],function (require, exports, module) {// Generated by CoffeeScript 1.6.3
(function() {
  var Backbone, Crop, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  module.exports = Crop = (function(_super) {
    __extends(Crop, _super);

    function Crop() {
      this.afterResize = __bind(this.afterResize, this);
      this.onResize = __bind(this.onResize, this);
      _ref = Crop.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Crop.prototype.tagName = 'div';

    Crop.prototype.className = 'crop';

    Crop.prototype.initialize = function() {
      this.listenTo(this.model, 'change:crop', function(model, crop) {
        return this.adjustSize(crop);
      });
      return this.listenTo(this.model, 'change:size', function(model) {
        this.setBoundaries(model.get('size'));
        return this.fit(model.get('crop'), model.get('size'), model.get('position'));
      });
    };

    Crop.prototype.render = function() {
      if (this.model.has('autocrop')) {
        this.adjustSize(this.model.get('autocrop'));
      }
      return this;
    };

    Crop.prototype.disable = function() {
      if (this.$el.is('.ui-resizable')) {
        return this.$el.resizable('disable');
      }
    };

    Crop.prototype.enable = function() {
      var model;
      if (!this.$el.is('.ui-resizable')) {
        model = this.model;
        this.$el.resizable({
          stop: this.afterResize,
          resize: this.onResize
        });
        this.setBoundaries(this.model.get('size'), this.model.get('position'));
      }
      return this.$el.resizable('enable');
    };

    Crop.prototype.onResize = function(e, ui) {
      var dx, dy, imgSize, newPosition, position;
      imgSize = this.model.get('size');
      position = this.model.get('position');
      dx = ui.size.width - imgSize[0] - position[0];
      dy = ui.size.height - imgSize[1] - position[1];
      newPosition = _.clone(position);
      if (dx > 0 || dy > 0) {
        if (dx > 0) {
          newPosition[0] = position[0] + dx;
        }
        if (dy > 0) {
          newPosition[1] = position[1] + dy;
        }
        return this.model.set({
          position: newPosition
        });
      }
    };

    Crop.prototype.afterResize = function(e, ui) {
      var size;
      size = [ui.size.width, ui.size.height];
      return this.model.save({
        crop: size,
        autocrop: size
      });
    };

    Crop.prototype.adjustSize = function(size) {
      this.$el.css({
        'width': size[0],
        'height': size[1]
      });
      return this.model.save({
        autocrop: size
      });
    };

    Crop.prototype.adjustBoundaries = function(size) {
      if (this.$el && this.$el.is('.ui-resizable')) {
        return this.$el.resizable({
          maxWidth: size[0],
          maxHeight: size[1]
        });
      }
    };

    Crop.prototype.setBoundaries = function(size) {
      var MAX_WIDTH, boundaries;
      if (!size) {
        return;
      }
      MAX_WIDTH = 722;
      boundaries = [Math.min(MAX_WIDTH, size[0]), size[1]];
      return this.adjustBoundaries(boundaries);
    };

    Crop.prototype.fit = function(crop, size, position) {
      var delta, newPosition, newSize, offsetSize;
      offsetSize = _.map(size, function(s, i) {
        return s + position[i];
      });
      if (crop[0] > offsetSize[0] || crop[1] > offsetSize[1]) {
        delta = [0, 0];
        if (crop[0] > offsetSize[0]) {
          delta[0] = Math.max(offsetSize[0] - crop[0], position[0]);
        }
        if (crop[1] > offsetSize[1]) {
          delta[1] = Math.max(offsetSize[1] - crop[1], position[1]);
        }
        newPosition = _.map(position, function(p, i) {
          return p - delta[i];
        });
        this.model.set({
          position: newPosition
        });
      }
      if (size[0] < crop[0] || size[1] < crop[1]) {
        newSize = [Math.min(offsetSize[0], crop[0]), Math.min(offsetSize[1], crop[1])];
        return this.adjustSize(newSize);
      }
    };

    return Crop;

  })(Backbone.View);

}).call(this);

});

define('src/image',['require','exports','module','backbone','jquery','underscore'],function (require, exports, module) {// Generated by CoffeeScript 1.6.3
(function() {
  var $, Backbone, Image, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  $ = require('jquery');

  _ = require('underscore');

  module.exports = Image = (function(_super) {
    __extends(Image, _super);

    function Image() {
      _ref = Image.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Image.prototype.tagName = 'figure';

    Image.prototype.initialize = function() {
      if (!this.model.has('asset')) {
        throw new Error('asset is required to render image');
      }
      this.listenTo(this.model, 'change:size', function(model, size) {
        return this.adjustSize(size);
      });
      this.listenTo(this.model, 'change:position', function(model, position) {
        return this.adjustPosition(position);
      });
      return this.listenTo(this.model, 'change:size change:crop', this.setDragBoundaries);
    };

    Image.prototype.render = function(callback) {
      this.$img = $('<img/>').addClass('unselectable').attr('unselectable', 'on').appendTo(this.$el);
      return this;
    };

    Image.prototype.load = function(asset, callback) {
      var _this = this;
      this.$img.on('load', function(e) {
        var defaultSize, gadgetWidth, originalSize;
        _this.$el.show();
        originalSize = [_this.$img[0].naturalWidth, _this.$img[0].naturalHeight];
        _this.model.set('originalSize', originalSize);
        if (_this.model.has('position')) {
          _this.adjustPosition(_this.model.get('position'));
        } else {
          _this.model.set({
            position: [0, 0]
          });
        }
        if (_this.model.has('size')) {
          _this.adjustSize(_this.model.get('size'));
        } else {
          gadgetWidth = _this.$el.width();
          defaultSize = originalSize;
          if (originalSize[0] > gadgetWidth) {
            defaultSize = [gadgetWidth, originalSize[1] * gadgetWidth / originalSize[0]];
          }
          _this.model.set({
            size: defaultSize,
            crop: defaultSize,
            autocrop: defaultSize
          });
        }
        if (callback) {
          return callback();
        }
      });
      return this.$img.attr('src', asset.representations[0].location);
    };

    Image.prototype.enable = function() {
      var _this = this;
      if (!this.$img.is('.ui-draggable')) {
        this.$img.draggable({
          stop: function(e, ui) {
            var pos;
            ui.position.left = Math.max(_this.boundaries[0], ui.position.left);
            ui.position.top = Math.max(_this.boundaries[1], ui.position.top);
            ui.position.left = Math.min(_this.boundaries[2], ui.position.left);
            ui.position.top = Math.min(_this.boundaries[3], ui.position.top);
            pos = [ui.position.left, ui.position.top];
            _this.model.save({
              position: pos
            });
            return void 0;
          },
          drag: function(e, ui) {
            ui.position.left = Math.max(_this.boundaries[0], ui.position.left);
            ui.position.top = Math.max(_this.boundaries[1], ui.position.top);
            ui.position.left = Math.min(_this.boundaries[2], ui.position.left);
            return ui.position.top = Math.min(_this.boundaries[3], ui.position.top);
          }
        });
      }
      return this.$img.draggable('enable');
    };

    Image.prototype.disable = function() {
      if (this.$img.is('.ui-draggable')) {
        return this.$img.draggable('disable');
      }
    };

    Image.prototype.setDragBoundaries = function() {
      var crop, minLeft, minTop, size;
      crop = this.model.get('crop');
      size = this.model.get('size');
      minLeft = Math.min(crop[0] - size[0], 0);
      minTop = Math.min(crop[1] - size[1], 0);
      return this.boundaries = [minLeft, minTop, 0, 0];
    };

    Image.prototype.adjustPosition = function(pos) {
      return this.$img.css({
        left: pos[0],
        top: pos[1]
      });
    };

    Image.prototype.adjustSize = function(size) {
      return this.$img.css({
        'width': size[0],
        'max-width': size[0],
        'height': size[1],
        'max-height': size[1]
      });
    };

    return Image;

  })(Backbone.View);

}).call(this);

});

define('src/zoom',['require','exports','module','backbone','underscore','jquery'],function (require, exports, module) {// Generated by CoffeeScript 1.6.3
(function() {
  var $, Backbone, Zoom, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  $ = require('jquery');

  module.exports = Zoom = (function(_super) {
    __extends(Zoom, _super);

    function Zoom() {
      _ref = Zoom.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Zoom.prototype.className = 'zoom';

    Zoom.prototype.DEFAULT_WIDTH = 720;

    Zoom.prototype.initialize = function(options) {
      var _this = this;
      this.listenTo(this.model, 'change:originalSize', function(model, size) {
        return _this.adjustRange(size);
      });
      return this.listenTo(this.model, 'change:size', function(model, size) {
        return _this.adjustValue(size[0]);
      });
    };

    Zoom.prototype.render = function() {
      this.$slider = $('<div class="slider"/>').appendTo(this.$el);
      return this;
    };

    Zoom.prototype.enable = function() {
      var _this = this;
      if (!this.$slider.is('.ui-slider')) {
        this.$slider.slider({
          range: 'min',
          slide: function(e, ui) {
            var ow, scale;
            ow = _this.model.get('originalSize')[0];
            scale = ui.value;
            if (Math.abs(scale - ow) < 10) {
              scale = ow;
              ui.value = ow;
            }
            _this.scale(scale);
            return void 0;
          }
        });
        this.$notch = $('<i class="notch" title="natural size"></i>').appendTo(this.$slider);
        if (this.model.has('originalSize')) {
          this.adjustRange(this.model.get('originalSize'));
        }
        if (this.model.has('size')) {
          this.adjustValue(this.model.get('size')[0]);
        }
      }
      this.$slider.slider('enable');
      return this.$el.show();
    };

    Zoom.prototype.disable = function() {
      if (this.$slider && this.$slider.is('.ui-slider')) {
        this.$slider.slider('disable');
      }
      return this.$el.hide();
    };

    Zoom.prototype.scale = function(width) {
      var autocrop, crop, cx, cy, newSize, originalSize, position, r, s1, size, x1, y1;
      originalSize = this.model.get('originalSize');
      s1 = width / originalSize[0];
      newSize = [width, originalSize[1] * s1];
      crop = this.model.get('crop');
      if (newSize[0] < crop[0] && newSize[1] < crop[1]) {
        position = [0, 0];
      } else {
        position = this.model.get('position');
        size = this.model.get('size');
        r = width / size[0];
        autocrop = this.model.get('autocrop');
        cx = (autocrop[0] / 2) - position[0];
        cy = (autocrop[1] / 2) - position[1];
        x1 = Math.min(0, autocrop[0] / 2 - cx * r);
        y1 = Math.min(0, autocrop[1] / 2 - cy * r);
        position = [x1, y1];
      }
      return this.model.save({
        size: newSize,
        position: position
      });
    };

    Zoom.prototype.adjustValue = function(width) {
      if (this.$slider && this.$slider.is('.ui-slider')) {
        return this.$slider.slider({
          value: width
        });
      }
    };

    Zoom.prototype.adjustRange = function(size) {
      var MAX_ZOOM, MIN_SIZE, landscape;
      if (!size) {
        return;
      }
      MIN_SIZE = 125;
      MAX_ZOOM = 3;
      landscape = size[0] <= size[1];
      this.min = landscape ? MIN_SIZE : MIN_SIZE * size[0] / size[1];
      this.max = size[0] * MAX_ZOOM;
      if (this.$slider.is('.ui-slider')) {
        this.$slider.slider({
          min: this.min,
          max: this.max
        });
        return this.setNotch(size[0]);
      }
    };

    Zoom.prototype.setNotch = function(width) {
      var dx, max, min, r, sliderWidth, x;
      if (!this.$notch) {
        return;
      }
      min = this.$slider.slider('option', 'min');
      max = this.$slider.slider('option', 'max');
      dx = max - min;
      sliderWidth = this.$slider.width();
      r = sliderWidth / dx;
      x = (width - min) * r;
      return this.$notch.css('left', x);
    };

    return Zoom;

  })(Backbone.View);

}).call(this);

});

define('src/replace_file',['require','exports','module','backbone'],function (require, exports, module) {// Generated by CoffeeScript 1.6.3
(function() {
  var Backbone, ReplaceFile, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  module.exports = ReplaceFile = (function(_super) {
    __extends(ReplaceFile, _super);

    function ReplaceFile() {
      _ref = ReplaceFile.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ReplaceFile.prototype.tagName = 'button';

    ReplaceFile.prototype.className = 'replace-file action';

    ReplaceFile.prototype.events = {
      'click': 'selectAsset'
    };

    ReplaceFile.prototype.initialize = function(_arg) {
      this.vent = _arg.vent;
    };

    ReplaceFile.prototype.render = function() {
      this.$el.text('replace file');
      return this;
    };

    ReplaceFile.prototype.selectAsset = function() {
      return this.vent.trigger('asset:select');
    };

    return ReplaceFile;

  })(Backbone.View);

}).call(this);

});

define('gadget',['require','exports','module','jquery','underscore','backbone','./src/crop','./src/image','./src/zoom','./src/replace_file'],function (require, exports, module) {// Generated by CoffeeScript 1.6.3
/*define - this is required for compilation to work:
  'cdn.jquery'
  'cdn.underscore'
  'cdn.backbone'
  'cdn.jqueryui'
*/


(function() {
  var $, Backbone, Crop, Gadget, Image, ReplaceFile, Zoom, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $ = require('jquery');

  _ = require('underscore');

  Backbone = require('backbone');

  Crop = require('./src/crop');

  Image = require('./src/image');

  Zoom = require('./src/zoom');

  ReplaceFile = require('./src/replace_file');

  module.exports = Gadget = (function(_super) {
    __extends(Gadget, _super);

    function Gadget() {
      this.assetSelected = __bind(this.assetSelected, this);
      this.selectAsset = __bind(this.selectAsset, this);
      _ref = Gadget.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Gadget.prototype.initialize = function(_arg) {
      this.player = _arg.player;
      this.vent = _.extend({}, Backbone.Events);
      this.listenTo(this.vent, 'asset:select', this.selectAsset);
      this.listenTo(this.player, 'toggleEdit', this.toggleEdit);
      this.listenTo(this.player, 'domReady', this.render);
      return this.replaceFile = new ReplaceFile({
        vent: this.vent
      });
    };

    Gadget.prototype.render = function(callback) {
      this.replaceFile.render().$el.appendTo(this.el);
      if (this.model.has('asset')) {
        if (this.$placeholder) {
          this.$placeholder.remove();
        }
        this.crop = new Crop({
          model: this.model
        });
        this.image = new Image({
          model: this.model
        });
        this.crop.render().$el.appendTo(this.el);
        this.image.render().$el.appendTo(this.crop.$el);
        this.image.load(this.model.get('asset'), callback);
      } else {
        this.$placeholder = $('<div class="placeholder no-media"></div>').text('No image chosen').appendTo(this.$el).show();
        this.player.trigger('configEmpty');
      }
      this.disable();
      return this;
    };

    Gadget.prototype.toggleEdit = function(editable) {
      if (editable) {
        return this.enable();
      } else {
        return this.disable();
      }
    };

    Gadget.prototype.enable = function() {
      this.replaceFile.$el.show();
      if (!this.model.has('asset')) {
        return this.selectAsset();
      }
      if (!this.zoom) {
        this.zoom = new Zoom({
          model: this.model
        });
        this.zoom.render().$el.appendTo(this.el);
      }
      this.image.enable();
      this.crop.enable();
      return this.zoom.enable();
    };

    Gadget.prototype.disable = function() {
      if (this.model.has('asset') && this.crop && this.zoom) {
        this.image.disable();
        this.crop.disable();
        this.zoom.disable();
      }
      return this.replaceFile.$el.hide();
    };

    Gadget.prototype.selectAsset = function() {
      return this.player.trigger('asset:select', {
        type: 'image',
        success: this.assetSelected
      });
    };

    Gadget.prototype.assetSelected = function(asset) {
      var _this = this;
      this.model.clear({
        silent: true
      });
      this.model.save({
        asset: asset
      });
      if (this.crop && this.image && this.zoom) {
        this.removeViews();
      }
      return this.render(function() {
        _this.enable();
        return _this.model.save();
      });
    };

    Gadget.prototype.removeViews = function() {
      this.crop.remove();
      this.image.remove();
      this.zoom.remove();
      delete this.zoom;
      delete this.crop;
      return delete this.image;
    };

    return Gadget;

  })(Backbone.View);

}).call(this);

});
define('backbone', [], function(){ return cdn.backbone; });
define('jquery', [], function(){ return cdn.jquery; });
define('underscore', [], function(){ return cdn.underscore; });
define('cdn.jquery', [], function(){ return cdn.jquery });
define('cdn.underscore', [], function(){ return cdn.underscore });
define('cdn.backbone', [], function(){ return cdn.backbone });
define('cdn.jqueryui', [], function(){ return cdn.jqueryui });
define('cdn.backbone', [], function(){ return cdn.backbone });
define('cdn.jquery', [], function(){ return cdn.jquery });
define('cdn.underscore', [], function(){ return cdn.underscore });
return require('gadget');});