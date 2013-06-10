
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('plugins/vs.api',factory);
    }

    // Deprecate this as soon as player adopts loading API as AMD module
    if (!root.vs) {
      root.vs = {};
    }
    root.vs.api = factory();
}(this, function () {

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
define("../src/build/almond",[], function(){});

define('helpers/backbone_collection_move',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, _;

  Backbone = require('backbone');

  _ = require('underscore');

  Backbone.Collection.prototype.move = function(model, toIndex, options) {
    var fromIndex;

    fromIndex = this.indexOf(model);
    if (fromIndex === -1) {
      throw new Error("Can't move a model that's not in the collection");
    }
    if (fromIndex !== toIndex) {
      this.models.splice(toIndex, 0, this.models.splice(fromIndex, 1)[0]);
    }
    this.trigger('sort', this);
    if (!(options != null ? options.silent : void 0)) {
      return this.reorder(options);
    }
  };

  Backbone.Collection.prototype.getIndexes = function() {
    return _.map(this.models, function(m) {
      return m.id;
    });
  };

  Backbone.Collection.prototype.reorder = function(options) {
    var indexes, _ref, _ref1;

    if (options == null) {
      options = {};
    }
    indexes = this.getIndexes();
    if (!indexes.length) {
      return;
    }
    if ((_ref = options.url) == null) {
      options.url = _.result(this, 'url') + '/order';
    }
    if ((_ref1 = options.attrs) == null) {
      options.attrs = indexes;
    }
    return this.sync('update', this, options);
  };

}).call(this);

});

define('models/asset_representation',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var AssetRepresentation, Backbone, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  AssetRepresentation = (function(_super) {
    __extends(AssetRepresentation, _super);

    function AssetRepresentation() {
      _ref = AssetRepresentation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AssetRepresentation.prototype.isType = function(contentType) {
      return this._isExactType(contentType) || this._isTypeWithWildcard(contentType);
    };

    AssetRepresentation.prototype._isExactType = function(contentType) {
      return contentType === this.get('contentType');
    };

    AssetRepresentation.prototype._isTypeWithWildcard = function(contentType) {
      var subType, type, _ref1;

      _ref1 = contentType.split('/'), type = _ref1[0], subType = _ref1[1];
      return subType === '*' && type === _.first(this.get('contentType').split('/'));
    };

    return AssetRepresentation;

  })(Backbone.Model);

  module.exports = AssetRepresentation;

}).call(this);

});

define('collections/asset_representations',['require','exports','module','../models/asset_representation','backbone'],function (require, exports, module) {(function() {
  var AssetRepresentation, AssetRepresentations, Backbone, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AssetRepresentation = require('../models/asset_representation');

  Backbone = require('backbone');

  AssetRepresentations = (function(_super) {
    __extends(AssetRepresentations, _super);

    function AssetRepresentations() {
      _ref = AssetRepresentations.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AssetRepresentations.prototype.model = AssetRepresentation;

    return AssetRepresentations;

  })(Backbone.Collection);

  module.exports = AssetRepresentations;

}).call(this);

});

define('models/asset',['require','exports','module','backbone','../collections/asset_representations','underscore'],function (require, exports, module) {(function() {
  var Asset, AssetRepresentations, Backbone, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  AssetRepresentations = require('../collections/asset_representations');

  _ = require('underscore');

  /*
  To create and upload an asset you need to:
  
    asset = new Asset # create an asset
    asset.save { # upload an asset
      content: fs.createReadStream('file/path')
      contentType: 'image/png'
    }, { upload: true }
  */


  Asset = (function(_super) {
    __extends(Asset, _super);

    Asset.prototype.urlRoot = '/assets';

    Asset.prototype.validTypes = ['image', 'video'];

    Asset.prototype.defaults = {
      tags: []
    };

    function Asset(attrs, options) {
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.representations = new AssetRepresentations([], {
        asset: this
      });
      options.parse = true;
      Asset.__super__.constructor.call(this, attrs, options);
    }

    Asset.prototype.sync = function(method, model, options) {
      if (options == null) {
        options = {};
      }
      options.parse = true;
      return Backbone.sync.apply(this, [method, model, options]);
    };

    Asset.prototype.parse = function(attrs) {
      if (attrs.representations) {
        this._expandLocations(attrs);
        this.representations.reset(attrs.representations);
        delete attrs.representations;
      }
      return attrs;
    };

    Asset.prototype.toJSON = function(options) {
      var json;

      if (options == null) {
        options = {};
      }
      json = _.clone(this.attributes);
      if (!options.upload) {
        json = _.omit(json, ['content', 'contentType']);
      }
      if (options.includeRepresentations) {
        _.extend(json, {
          representations: this.representations.toJSON()
        });
      }
      return json;
    };

    Asset.prototype.hasRepresentation = function(contentType) {
      return this.representations.any(function(rep) {
        return rep.isType(contentType);
      });
    };

    Asset.prototype.getRepresentation = function(contentType) {
      var repsOfContentType;

      repsOfContentType = this.representations.select(function(rep) {
        return rep.isType(contentType);
      });
      return _.map(repsOfContentType, function(rep) {
        return rep.get('location');
      });
    };

    Asset.prototype.validate = function(attrs, options) {
      if (options == null) {
        options = {};
      }
      if (this.attributes) {
        attrs = _.extend(this.attributes, attrs);
      }
      if (options.upload) {
        if (!attrs.content) {
          return 'content is required to upload an asset';
        }
        if (!(attrs.contentType && _.contains(this.validTypes, attrs.contentType.split('/')[0]))) {
          return 'contentType should contain valid content type';
        }
      }
      if (!attrs.title) {
        return 'title is required';
      }
    };

    Asset.prototype._expandLocations = function(data) {
      var _this = this;

      return _.each(data.representations, function(rep) {
        if (!rep.location.match(/^https?:\/\//)) {
          return rep.location = _this.baseUrl + rep.location;
        }
      });
    };

    return Asset;

  })(Backbone.Model);

  module.exports = Asset;

}).call(this);

});

define('collections/assets',['require','exports','module','../models/asset','backbone','underscore'],function (require, exports, module) {(function() {
  var Asset, Assets, Backbone, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Asset = require('../models/asset');

  Backbone = require('backbone');

  _ = require('underscore');

  Assets = (function(_super) {
    __extends(Assets, _super);

    function Assets() {
      _ref = Assets.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Assets.prototype.url = function() {
      return '/assets';
    };

    Assets.prototype.model = Asset;

    Assets.prototype.fetchByField = function(field, val, params) {
      var data, options;

      if (params == null) {
        params = {};
      }
      data = _.extend({}, params.data);
      data[field] = val;
      options = _.extend({}, params, {
        data: data
      });
      return this.fetch(options);
    };

    Assets.prototype.fetchByCreator = function(creator, params) {
      return this.fetchByField('creator', creator, params);
    };

    Assets.prototype.fetchByTagLead = function(tagLead, params) {
      return this.fetchByField('tagLead', tagLead, params);
    };

    return Assets;

  })(Backbone.Collection);

  module.exports = Assets;

}).call(this);

});

define('models/gadget_userstate',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetState, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  GadgetState = (function(_super) {
    __extends(GadgetState, _super);

    function GadgetState() {
      _ref = GadgetState.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetState.prototype.url = function() {
      return this.gadget.url() + '/userstate';
    };

    GadgetState.prototype.isNew = function() {
      return false;
    };

    GadgetState.prototype.initialize = function(data, options) {
      if (!(options != null ? options.gadget : void 0)) {
        throw new Error('gadget should be provided to create a gadget state');
      }
      return this.gadget = options.gadget;
    };

    return GadgetState;

  })(Backbone.Model);

  module.exports = GadgetState;

}).call(this);

});

define('models/gadget_config',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetConfig, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  GadgetConfig = (function(_super) {
    __extends(GadgetConfig, _super);

    function GadgetConfig() {
      _ref = GadgetConfig.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetConfig.prototype.url = function() {
      return this.gadget.url() + '/config';
    };

    GadgetConfig.prototype.isNew = function() {
      return false;
    };

    GadgetConfig.prototype.initialize = function(data, options) {
      if (!(options != null ? options.gadget : void 0)) {
        throw new Error('gadget should be provided to create a gadget config');
      }
      return this.gadget = options.gadget;
    };

    GadgetConfig.prototype.setDefaults = function(vals) {
      return this.set(_.omit(vals, _.keys(this.attributes)));
    };

    return GadgetConfig;

  })(Backbone.Model);

  module.exports = GadgetConfig;

}).call(this);

});

define('models/gadget',['require','exports','module','backbone','underscore','./gadget_userstate','./gadget_config'],function (require, exports, module) {(function() {
  var Backbone, Gadget, GadgetConfig, GadgetUserstate, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetUserstate = require('./gadget_userstate');

  GadgetConfig = require('./gadget_config');

  Gadget = (function(_super) {
    __extends(Gadget, _super);

    function Gadget(attrs, options) {
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.config = new GadgetConfig({}, {
        gadget: this
      });
      this.userState = new GadgetUserstate({}, {
        gadget: this
      });
      options.parse = true;
      Gadget.__super__.constructor.call(this, attrs, options);
    }

    Gadget.prototype.parse = function(attrs) {
      if (!attrs) {
        return;
      }
      if (attrs.config) {
        this.config.set(_.clone(attrs.config), {
          silent: true
        });
      }
      if (attrs.userState) {
        this.userState.set(_.clone(attrs.userState), {
          silent: true
        });
      }
      return _.omit(attrs, ['config', 'userState']);
    };

    Gadget.prototype.toJSON = function() {
      var json;

      json = _.clone(this.attributes);
      if (this.config) {
        json.config = this.config.toJSON();
      }
      if (this.userState) {
        json.userState = this.userState.toJSON();
      }
      return json;
    };

    Gadget.prototype.validate = function(attrs) {
      if (!attrs.type) {
        return 'Type is required. Did you call parse:true when instantiated your gadget?';
      }
    };

    return Gadget;

  })(Backbone.Model);

  module.exports = Gadget;

}).call(this);

});

define('collections/gadgets',['require','exports','module','backbone','underscore','../models/gadget'],function (require, exports, module) {(function() {
  var Backbone, Gadget, Gadgets, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Gadget = require('../models/gadget');

  Gadgets = (function(_super) {
    __extends(Gadgets, _super);

    function Gadgets() {
      _ref = Gadgets.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Gadgets.prototype.model = Gadget;

    Gadgets.prototype.url = function() {
      if (this.lesson) {
        return this.lesson.url() + '/gadgets';
      }
    };

    Gadgets.prototype.initialize = function(models, options) {
      return this.lesson = options && options.lesson ? options.lesson : void 0;
    };

    return Gadgets;

  })(Backbone.Collection);

  module.exports = Gadgets;

}).call(this);

});

define('models/lesson',['require','exports','module','backbone','underscore','../collections/gadgets'],function (require, exports, module) {(function() {
  var Backbone, Gadgets, Lesson, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Gadgets = require('../collections/gadgets');

  Lesson = (function(_super) {
    __extends(Lesson, _super);

    Lesson.prototype.defaults = {
      title: 'Untitled lesson'
    };

    function Lesson(attrs, options) {
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.gadgets = new Gadgets([], {
        lesson: this
      });
      options.parse = true;
      Lesson.__super__.constructor.call(this, attrs, options);
    }

    Lesson.prototype.parse = function(attrs) {
      if (!attrs) {
        return;
      }
      if (attrs.gadgets) {
        this.gadgets.reset(attrs.gadgets, {
          parse: true
        });
      }
      return _.omit(attrs, 'gadgets');
    };

    Lesson.prototype.validate = function(attrs, options) {
      if (!attrs.title) {
        return 'Title must be not empty';
      }
    };

    Lesson.prototype.addSection = function(title) {
      return this.gadgets.create({
        type: 'gadget/section',
        config: {
          content: title
        }
      });
    };

    return Lesson;

  })(Backbone.Model);

  module.exports = Lesson;

}).call(this);

});

define('collections/lessons',['require','exports','module','backbone','underscore','../models/lesson'],function (require, exports, module) {(function() {
  var Backbone, Lesson, Lessons, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Lesson = require('../models/lesson');

  Lessons = (function(_super) {
    __extends(Lessons, _super);

    function Lessons() {
      _ref = Lessons.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Lessons.prototype.model = Lesson;

    Lessons.prototype.url = function() {
      if (this.course) {
        return this.course.url() + '/lessons';
      }
    };

    Lessons.prototype.initialize = function(models, options) {
      if (!(options != null ? options.course : void 0)) {
        throw new Error('Reference to a course is mandatory for a lesson');
      }
      return this.course = options.course;
    };

    return Lessons;

  })(Backbone.Collection);

  module.exports = Lessons;

}).call(this);

});

define('models/course_progress',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, CourseProgress, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  CourseProgress = (function(_super) {
    __extends(CourseProgress, _super);

    function CourseProgress() {
      _ref = CourseProgress.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CourseProgress.prototype.url = function() {
      return this.course.url() + '/progress';
    };

    CourseProgress.prototype.isNew = function() {
      return false;
    };

    CourseProgress.prototype.initialize = function(data, options) {
      if (!(options != null ? options.course : void 0)) {
        throw new Error('course should be provided to create a couse progress');
      }
      return this.course = options.course;
    };

    return CourseProgress;

  })(Backbone.Model);

  module.exports = CourseProgress;

}).call(this);

});

define('models/course',['require','exports','module','backbone','underscore','../collections/lessons','./course_progress'],function (require, exports, module) {(function() {
  var Backbone, Course, CourseProgress, Lessons, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Lessons = require('../collections/lessons');

  CourseProgress = require('./course_progress');

  Course = (function(_super) {
    __extends(Course, _super);

    Course.prototype.urlRoot = '/courses';

    Course.prototype.defaults = {
      title: 'Untitled course',
      isEditable: false
    };

    function Course() {
      this.lessons = new Lessons([], {
        course: this
      });
      this.progress = new CourseProgress({}, {
        course: this
      });
      Backbone.Model.apply(this, arguments);
    }

    Course.prototype.parse = function(attrs) {
      if (!attrs) {
        return;
      }
      if (attrs.lessons) {
        this.lessons.reset(attrs.lessons, {
          parse: true
        });
      }
      return _.omit(attrs, 'lessons');
    };

    Course.prototype.validate = function(attrs, options) {
      if (!attrs.title) {
        return 'Title must be not empty';
      }
    };

    Course.prototype.stage = function(options) {
      var _success,
        _this = this;

      if (!this.lessons.length) {
        throw new Error('Course must have at least one lesson');
      }
      options.url = this.url() + '/stage';
      _success = options.success;
      options.success = function(data) {
        _this.id = data.courseId;
        return _success != null ? _success.apply(_this, arguments) : void 0;
      };
      return this.sync('create', this, options);
    };

    Course.prototype.start = function(options) {
      if (options == null) {
        options = {};
      }
      options.url = this.url() + '/start';
      return this.sync('create', this, options);
    };

    Course.prototype.complete = function(options) {
      if (options == null) {
        options = {};
      }
      options.url = this.url() + '/completion';
      return this.sync('update', this, options);
    };

    return Course;

  })(Backbone.Model);

  module.exports = Course;

}).call(this);

});

define('collections/courses',['require','exports','module','../models/course','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, Course, Courses, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Course = require('../models/course');

  Backbone = require('backbone');

  _ = require('underscore');

  Courses = (function(_super) {
    __extends(Courses, _super);

    function Courses() {
      _ref = Courses.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Courses.prototype.model = Course;

    Courses.prototype.url = function() {
      return '/courses';
    };

    Courses.prototype.fetch = function(options) {
      if (options && options.data && options.data.catalog) {
        return Courses.__super__.fetch.apply(this, arguments);
      } else {
        throw 'Courses may not be fetched directly';
      }
    };

    Courses.prototype.fetchCatalog = function(catalog, params) {
      var data, options;

      if (params == null) {
        params = {};
      }
      data = _.extend({}, params.data, {
        catalog: catalog
      });
      options = _.extend({}, params, {
        data: data
      });
      return this.fetch(options);
    };

    Courses.prototype.fetchUser = function(params) {
      return this.fetchCatalog('user', params);
    };

    Courses.prototype.fetchLabs = function(params) {
      return this.fetchCatalog('labs', params);
    };

    return Courses;

  })(Backbone.Collection);

  module.exports = Courses;

}).call(this);

});

define('models/gadget_project',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, GadgetProject, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetProject = (function(_super) {
    __extends(GadgetProject, _super);

    GadgetProject.prototype.urlRoot = '/gadgets';

    GadgetProject.prototype.baseUrl = '';

    function GadgetProject(data, options) {
      if (data == null) {
        data = {};
      }
      if (options == null) {
        options = {};
      }
      options.parse = true;
      GadgetProject.__super__.constructor.call(this, data, options);
    }

    GadgetProject.prototype.sync = function(method, model, options) {
      if (options == null) {
        options = {};
      }
      if (method === 'update') {
        options.url = this.url() + '/status';
        method = 'create';
      }
      options.parse = true;
      return Backbone.sync.apply(this, [method, model, options]);
    };

    GadgetProject.prototype.toJSON = function(options) {
      var json;

      if (options == null) {
        options = {};
      }
      json = _.clone(this.attributes);
      if (!options.upload) {
        delete json.content;
        delete json.contentType;
      }
      return json;
    };

    GadgetProject.prototype.parse = function(attrs, options) {
      var key, value, _ref;

      if (!attrs.files) {
        return attrs;
      }
      _ref = attrs.files;
      for (key in _ref) {
        value = _ref[key];
        if (value.slice(0, 4) !== 'http') {
          attrs.files[key] = this.baseUrl + value;
        }
      }
      this.main = attrs.files['gadget.js'];
      this.css = attrs.files['gadget.css'];
      return attrs;
    };

    GadgetProject.prototype.validate = function(attrs, options) {
      if (options == null) {
        options = {};
      }
      if (this.attributes) {
        attrs = _.extend(this.attributes, attrs);
      }
      if (options.upload) {
        if (!attrs.content) {
          return 'content is required to create a gadget';
        }
      }
    };

    return GadgetProject;

  })(Backbone.Model);

  module.exports = GadgetProject;

}).call(this);

});

define('collections/gadget_projects',['require','exports','module','backbone','underscore','../models/gadget_project'],function (require, exports, module) {(function() {
  var Backbone, GadgetProject, GadgetProjects, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetProject = require('../models/gadget_project');

  GadgetProjects = (function(_super) {
    __extends(GadgetProjects, _super);

    function GadgetProjects() {
      _ref = GadgetProjects.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetProjects.prototype.url = function() {
      return '/gadgets';
    };

    GadgetProjects.prototype.model = GadgetProject;

    GadgetProjects.prototype.fetchFiltered = function(query, params) {
      var data, options;

      if (params == null) {
        params = {};
      }
      data = _.extend({}, params.data, query);
      options = _.extend({}, params, {
        data: data
      });
      return this.fetch(options);
    };

    GadgetProjects.prototype.fetchApproved = function(params) {
      return this.fetchFiltered({
        catalog: 'approved'
      }, params);
    };

    GadgetProjects.prototype.fetchSandbox = function(params) {
      return this.fetchFiltered({
        user: 'me',
        catalog: 'sandbox'
      }, params);
    };

    GadgetProjects.prototype.fetchPending = function(params) {
      return this.fetchFiltered({
        user: 'me',
        catalog: 'pending'
      }, params);
    };

    GadgetProjects.prototype.fetchRejected = function(params) {
      return this.fetchFiltered({
        user: 'me',
        catalog: 'rejected'
      }, params);
    };

    GadgetProjects.prototype.fetchUnapproved = function(params) {
      var _this = this;

      return $.when(this.fetchSandbox(params), this.fetchPending(params)).done(function(a, b) {
        return _this.reset(a[0].concat(b[0]));
      });
    };

    return GadgetProjects;

  })(Backbone.Collection);

  module.exports = GadgetProjects;

}).call(this);

});

define('models/user',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, User, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  User = (function(_super) {
    __extends(User, _super);

    function User() {
      _ref = User.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    User.prototype.urlRoot = '/users';

    User.current = function(options) {
      var user;

      if (options == null) {
        options = {};
      }
      user = new User();
      options.self = true;
      return user.fetch(options);
    };

    User.prototype.defaults = function() {
      return {
        fn: '',
        location: '',
        shortDesc: '',
        longDesc: '',
        website: '',
        social: [],
        registered: false,
        roles: {
          author: false,
          developer: false
        }
      };
    };

    User.prototype.fetch = function(options) {
      if (options.self) {
        options.url = '/user';
      }
      return User.__super__.fetch.call(this, options);
    };

    User.prototype.validate = function(attrs, options) {
      if (!attrs.username) {
        return 'username is required';
      }
    };

    User.prototype.signin = function(options) {
      options.url = '/signin/' + this.id;
      return this.sync('create', this, options);
    };

    User.prototype.becomeAuthor = function(options) {
      var success,
        _this = this;

      if (options == null) {
        options = {};
      }
      options.url = '/author';
      success = options.success;
      options.success = function() {
        _this.set('roles', _.extend(_this.get('roles'), {
          author: true
        }));
        if (success) {
          return success.apply(_this, arguments);
        }
      };
      return this.sync('create', this, options);
    };

    return User;

  })(Backbone.Model);

  module.exports = User;

}).call(this);

});

define('api_errors',['require','exports','module'],function (require, exports, module) {(function() {
  var ApplicationError, NotFound, PermissionDenied,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  NotFound = (function(_super) {
    __extends(NotFound, _super);

    function NotFound() {
      this.name = 'NotFound';
      NotFound.__super__.constructor.apply(this, arguments);
    }

    return NotFound;

  })(Error);

  PermissionDenied = (function(_super) {
    __extends(PermissionDenied, _super);

    function PermissionDenied() {
      this.name = 'PermissionDenied';
      PermissionDenied.__super__.constructor.apply(this, arguments);
    }

    return PermissionDenied;

  })(Error);

  ApplicationError = (function(_super) {
    __extends(ApplicationError, _super);

    function ApplicationError() {
      this.name = 'ApplicationError';
      ApplicationError.__super__.constructor.apply(this, arguments);
    }

    return ApplicationError;

  })(Error);

  module.exports = {
    NotFound: NotFound,
    PermissionDenied: PermissionDenied,
    ApplicationError: ApplicationError
  };

}).call(this);

});

define('adapters/browser',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, BrowserUploadAdapter, _;

  Backbone = require('backbone');

  _ = require('underscore');

  module.exports = BrowserUploadAdapter = (function() {
    function BrowserUploadAdapter() {}

    BrowserUploadAdapter.prototype.ajax = function(options) {
      var requestOptions;

      requestOptions = this.createRequestOptions(options);
      _.extend(requestOptions, {
        cache: false,
        contentType: false,
        processData: false
      });
      return $.ajax(requestOptions);
    };

    BrowserUploadAdapter.prototype.createRequestOptions = function(options) {
      return options;
    };

    BrowserUploadAdapter.prototype.createFormData = function(model) {
      var formData, key, val, _ref;

      formData = new FormData;
      _ref = model.toJSON({
        upload: true
      });
      for (key in _ref) {
        val = _ref[key];
        if (!(val instanceof File) && (_.isArray(val) || _.isObject(val))) {
          val = JSON.stringify(val);
        }
        formData.append(key, val);
      }
      return formData;
    };

    BrowserUploadAdapter.prototype.sendRequest = function(options) {};

    return BrowserUploadAdapter;

  })();

}).call(this);

});

define('api',['require','exports','module','backbone','jquery','underscore','./helpers/backbone_collection_move','./models/asset','./collections/assets','./models/asset_representation','./collections/asset_representations','./models/course','./models/course_progress','./collections/courses','./models/gadget','./collections/gadgets','./models/gadget_project','./collections/gadget_projects','./models/lesson','./collections/lessons','./models/user','./models/gadget','./api_errors','./adapters/node','./adapters/browser'],function (require, exports, module) {(function() {
  var Backbone, api, _;

  Backbone = require('backbone');

  Backbone.$ = require('jquery');

  _ = require('underscore');

  require('./helpers/backbone_collection_move');

  module.exports = api = {
    Asset: require('./models/asset'),
    Assets: require('./collections/assets'),
    AssetRepresentation: require('./models/asset_representation'),
    AssetRepresentations: require('./collections/asset_representations'),
    Course: require('./models/course'),
    CourseProgress: require('./models/course_progress'),
    Courses: require('./collections/courses'),
    Gadget: require('./models/gadget'),
    Gadgets: require('./collections/gadgets'),
    GadgetProject: require('./models/gadget_project'),
    GadgetProjects: require('./collections/gadget_projects'),
    Lesson: require('./models/lesson'),
    Lessons: require('./collections/lessons'),
    User: require('./models/user'),
    GadgetInstance: require('./models/gadget'),
    errors: require('./api_errors'),
    errorHandler: function(model, resp, options) {
      var errors;

      if (options == null) {
        options = {};
      }
      if (model instanceof Error) {
        return model;
      } else if (resp && resp.status) {
        errors = api.errors;
        switch (resp.status) {
          case 401:
          case 403:
            return new errors.PermissionDenied;
          case 404:
            return new errors.NotFound;
          default:
            return new errors.ApplicationError;
        }
      } else {
        return new Error('Unexpected result to error handler: ' + JSON.stringify(arguments));
      }
    },
    sessionId: 'SECRET',
    sessionIdKey: 'SESSION_ID',
    apiUrl: null,
    getUploadAdapter: function() {
      var isNode;

      isNode = typeof Buffer !== 'undefined';
      if (isNode) {
        return new (require('./adapters/node'));
      } else {
        return new (require('./adapters/browser'));
      }
    },
    connect: function(options) {
      if (!options.url) {
        throw new Error('url is required to connect to the API');
      }
      this.apiUrl = options.url.replace(/\/$/, '');
      this.Asset.prototype.baseUrl = this.apiUrl;
      this.GadgetProject.prototype.baseUrl = this.apiUrl;
      if (options.sessionIdKey) {
        this.sessionIdKey = options.sessionIdKey;
      }
      if (options.sessionId) {
        return this.sessionId = options.sessionId;
      }
    },
    init: function(options) {
      var ajax, sync,
        _this = this;

      this.uploadAdapter = (options != null ? options.uploadAdapter : void 0) || this.getUploadAdapter();
      if (!this._backbonePatched) {
        this._backbonePatched = true;
        ajax = Backbone.ajax;
        Backbone.ajax = function(opts) {
          if (opts.upload && _this.uploadAdapter) {
            return _this.uploadAdapter.ajax.apply(_this.uploadAdapter, arguments);
          } else {
            return ajax.apply(_this, arguments);
          }
        };
        sync = Backbone.sync;
        Backbone.sync = function(method, model, options) {
          var beforeSend;

          if (options == null) {
            options = {};
          }
          options.url = _this.apiUrl + (options.url || _.result(model, 'url'));
          beforeSend = options.beforeSend;
          options.beforeSend = function(xhr) {
            xhr.setRequestHeader(_this.sessionIdKey, _this.sessionId);
            if (beforeSend) {
              return beforeSend.apply(_this, arguments);
            }
          };
          if (options.upload) {
            options.data = _this.uploadAdapter.createFormData(model);
          }
          return sync.apply(_this, arguments);
        };
      }
      options.url = options.apiUrl;
      if (options.url) {
        return this.connect(options);
      }
    }
  };

}).call(this);

});
  define('underscore', [], function(){
    return window._;
  });

  define('backbone', [], function(){
    return window.Backbone;
  });

  define('jquery', [], function(){
    return window.$;
  });

  define('adapters/node', [], function(){});

  return require('api');
}));
/**
 * @license RequireJS text 2.0.5 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, window: false, process: false, Packages: false,
  java: false, location: false */

define('text',['module'], function (module) {
    

    var text, fs,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = [],
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.5',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node)) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback) {
            var file = fs.readFileSync(url, 'utf8');
            //Remove BOM (Byte Mark Order) from utf8 files if it is there.
            if (file.indexOf('\uFEFF') === 0) {
                file = file.substring(1);
            }
            callback(file);
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                stringBuffer.append(line);

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    }

    return text;
});

define('text!templates/course.html',[],function () { return '<div class="courseHeader">\n  <div class="headerContent">\n    <i class="js-toggle-toc toc-icon"></i>\n    <div class="courseTitleWrapper">\n      <h2 class="title courseTitle"><%= title %></h2>\n    </div>\n\n    <div class="row bottomHalf">\n      <div class="lessonTitleWrapper">\n        <div class="lessonTitle" contenteditable="false" placeholder="Untitled lesson">\n          <%= firstLessonTitle %>\n        </div>\n      </div>\n      <!-- Per #44573495, hide these until they\'re working\n      <ul class="lessonControls">\n        <li class="js-search search"></li>\n        <li class="js-fav fav"></li>\n        <li class="js-overview-disabled overview disabled"></li>\n        <li class="js-more more"></li>\n      </ul>\n      -->\n      <div class=\'completion\'>\n        Course complete! <button class=\'btn btn-success js-complete\'>Continue →</button>\n      </div>\n    </div>\n\n  </div>\n\n</div>\n\n<div class="lessons"></div>\n\n<div class="toc"></div>\n\n';});

(function() {
  var __slice = [].slice;

  define('messages/channel',[], function() {
    var Channel;
    return Channel = (function() {

      function Channel() {
        this._subscribers = [];
        this.channels = {};
      }

      Channel.prototype.on = function(callback, context) {
        var subscriber;
        if (context == null) {
          context = this;
        }
        subscriber = {
          context: context,
          callback: callback
        };
        return this._subscribers.push(subscriber);
      };

      Channel.prototype.off = function(callback, context) {
        var i, sub, _i, _ref, _results;
        if (context == null) {
          context = null;
        }
        _results = [];
        for (i = _i = _ref = this._subscribers.length - 1; _i >= 0; i = _i += -1) {
          sub = this._subscribers[i];
          if (!callback) {
            _results.push(this._subscribers.splice(i, 1));
          } else if (sub.callback === callback) {
            if (!(context != null) || sub.context === context) {
              _results.push(this._subscribers.splice(i, 1));
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Channel.prototype.trigger = function() {
        var data, sub, _i, _len, _ref, _results;
        data = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        _ref = this._subscribers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          _results.push(sub.callback.apply(sub.context, data));
        }
        return _results;
      };

      return Channel;

    })();
  });

}).call(this);

(function() {
  var __slice = [].slice;

  define('messages/mediator',['messages/channel'], function(Channel) {
    var Mediator;
    return Mediator = (function() {

      function Mediator() {
        this.channels = new Channel;
      }

      Mediator.prototype.getChannel = function(name) {
        var address, channel, channels, segment;
        address = name.split(':');
        channel = this.channels;
        while (address.length) {
          segment = address.shift();
          channels = channel.channels;
          channels[segment] || (channels[segment] = new Channel);
          channel = channels[segment];
        }
        return channel;
      };

      Mediator.prototype.on = function(name, callback, context) {
        var channel;
        channel = this.getChannel(name);
        return channel.on(callback, (context != null ? context : context = this));
      };

      Mediator.prototype.off = function(name, callback, context) {
        var channel;
        channel = this.getChannel(name);
        return channel.off(callback, (context != null ? context : context = this));
      };

      Mediator.prototype.trigger = function() {
        var address, channel, data, name, _results;
        name = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        address = name.split(':');
        channel = this.channels;
        _results = [];
        while (address.length) {
          if (!(channel = channel.channels[address.shift()])) {
            break;
          }
          if (address.length) {
            _results.push(channel.trigger.apply(channel, [address.join(':')].concat(__slice.call(data))));
          } else {
            _results.push(channel.trigger.apply(channel, data));
          }
        }
        return _results;
      };

      Mediator.prototype.triggerGadgetEvent = function() {
        var args, gadgetId, name;
        gadgetId = arguments[0], name = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        name = "gadget:" + gadgetId + ":" + name;
        return this.trigger.apply(this, [name].concat(__slice.call(args)));
      };

      return Mediator;

    })();
  });

}).call(this);

define('text!templates/asset_picker/asset_item.html',[],function () { return '<img class="thumbnail" src="<%= thumbnail %>" />\n<span class="title" title="<%= title %>"><%= title %></span>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/asset_picker/asset_item',['cdn.marionette', 'text!templates/asset_picker/asset_item.html'], function(Marionette, template) {
    var AssetItemView;
    return AssetItemView = (function(_super) {

      __extends(AssetItemView, _super);

      function AssetItemView() {
        return AssetItemView.__super__.constructor.apply(this, arguments);
      }

      AssetItemView.prototype.className = 'asset';

      AssetItemView.prototype.tagName = 'li';

      AssetItemView.prototype.events = {
        'click': 'onClick'
      };

      AssetItemView.prototype.template = _.template(template);

      AssetItemView.prototype.getTemplateThumbnail = function() {
        var rep, representations;
        representations = this.model.representations;
        if (representations.length > 0) {
          rep = representations.find(function(r) {
            return r.get("scale") === "320x240";
          });
        }
        if (rep) {
          return rep.get('location');
        } else {
          return 'http://placehold.it/100x100';
        }
      };

      AssetItemView.prototype.templateHelpers = function() {
        return {
          thumbnail: this.getTemplateThumbnail()
        };
      };

      AssetItemView.prototype.onClick = function() {
        return this.model.trigger('select', this.model);
      };

      return AssetItemView;

    })(Marionette.ItemView);
  });

}).call(this);

define('text!templates/asset_picker/asset_browse.html',[],function () { return '<div>\n  <section class="controls">\n    <!--<div class="searchRow row">\n      <input type="text" placeholder="Search by tag" class="js-asset-filter search pull-left"/>\n    </div>-->\n  </section>\n  <div class="browse">\n    <ul class="assets js-asset-list"></ul>\n  </div>\n</div>\n\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/asset_picker/asset_browse',['cdn.marionette', 'views/asset_picker/asset_item', 'text!templates/asset_picker/asset_browse.html'], function(Marionette, AssetItemView, template) {
    var AssetBrowseView;
    return AssetBrowseView = (function(_super) {

      __extends(AssetBrowseView, _super);

      function AssetBrowseView() {
        return AssetBrowseView.__super__.constructor.apply(this, arguments);
      }

      AssetBrowseView.prototype.template = template;

      AssetBrowseView.prototype.itemViewContainer = '.assets';

      AssetBrowseView.prototype.itemView = AssetItemView;

      AssetBrowseView.prototype.initialize = function(options) {
        return this.type = options.type;
      };

      AssetBrowseView.prototype.show = function(modal) {
        return this.$el.show();
      };

      AssetBrowseView.prototype.onCollectionSync = function() {
        return this._loading.done();
      };

      AssetBrowseView.prototype.onRender = function() {
        this.collection.fetchByTagLead(this.type);
        this.listenTo(this.collection, 'sync', this.onCollectionSync, this);
        return this._loading = new vs.ui.Loading(this.$('.assets'));
      };

      return AssetBrowseView;

    })(Marionette.CompositeView);
  });

}).call(this);

define('text!templates/asset_picker/asset_upload.html',[],function () { return '<div>\n  <div class="file-preview"></div>\n  <form class="form-horizontal">\n    <div class="control-group">\n      <label class="control-label">Title</label>\n      <div class="controls">\n        <input type="text" class="title" name="title"/>\n      </div>\n    </div>\n\n    <div class="control-group">\n      <label class="control-label">Tags</label>\n      <div class="controls">\n        <input type="text" class="tags" name="tags" placeholder="Separate tags with commas"/>\n      </div>\n    </div>\n\n    <div class="form-actions">\n      <button class="btn btn-primary js-add-asset addAssetButton">Upload</button>\n    </div>\n  </form>\n</div>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/asset_picker/asset_upload',['cdn.marionette', 'text!templates/asset_picker/asset_upload.html'], function(Marionette, template) {
    var AssetUploadView;
    return AssetUploadView = (function(_super) {

      __extends(AssetUploadView, _super);

      function AssetUploadView() {
        this.onUploadSuccess = __bind(this.onUploadSuccess, this);
        return AssetUploadView.__super__.constructor.apply(this, arguments);
      }

      AssetUploadView.prototype.template = template;

      AssetUploadView.prototype.ui = {
        'filePreview': '.file-preview',
        'title': '.title'
      };

      AssetUploadView.prototype.events = {
        'submit form': 'onFormSubmit'
      };

      AssetUploadView.prototype.initialize = function(options) {
        var _ref,
          _this = this;
        this.file = (_ref = options.files) != null ? _ref[0] : void 0;
        this.type = options.type;
        this.fr = new FileReader();
        return this.fr.onload = function(e) {
          return _this.onFileLoadFromDisk.call(_this, e);
        };
      };

      AssetUploadView.prototype.show = function(modal) {
        return this.$el.show();
      };

      AssetUploadView.prototype.onRender = function() {
        return this.fr.readAsDataURL(this.file);
      };

      AssetUploadView.prototype.onFileLoadFromDisk = function(e) {
        if (this.type === "image") {
          this.ui.filePreview.append($('<img>').attr('src', e.target.result));
        } else if (this.type === "video") {
          this.ui.filePreview.append($("<video preload='none' controls='controls'>\n  <source src='" + e.target.result + "'>\n</video>"));
        }
        return this.ui.title.val(this.file.name);
      };

      AssetUploadView.prototype.onFormSubmit = function(e) {
        var attributes;
        e.preventDefault();
        attributes = {
          title: this.$('[name="title"]').val(),
          tags: this.$('[name="tags"]').val().split(','),
          content: this.file,
          contentType: this.file.type
        };
        this.asset = new vs.api.Asset;
        return this.asset.save(attributes, {
          upload: true,
          success: this.onUploadSuccess,
          error: this.onUploadError
        });
      };

      AssetUploadView.prototype.onUploadSuccess = function(model, attributes) {
        var serverAttrs;
        serverAttrs = this.asset.parse(attributes);
        if (this.asset.set(serverAttrs)) {
          this.collection.add(this.asset);
          return this.collection.trigger('select', this.asset);
        } else {
          throw new Error('Failed parsing asset');
        }
      };

      AssetUploadView.prototype.onUploadError = function() {
        return console.log('Upload failed');
      };

      return AssetUploadView;

    })(Marionette.ItemView);
  });

}).call(this);

define('text!templates/asset_picker/asset_picker.html',[],function () { return '<div>\n\n  <div class="assets-modal modal">\n    <div class="modal-header">\n      <button type="button" data-dismiss="modal" class="close js-close-modal">&times;</button>\n      <h3>Asset Picker</h3>\n    </div>\n\n    <div class="modal-body js-content">\n      <div class="js-browse-region"></div>\n      <div class="js-upload-region hidden"></div>\n    </div>\n  </div>\n\n  <div class="modal-backdrop"></div>\n</div>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/asset_picker/asset_picker',['cdn.marionette', 'views/asset_picker/asset_browse', 'views/asset_picker/asset_upload', 'text!templates/asset_picker/asset_picker.html'], function(Marionette, AssetBrowseView, AssetUploadView, template) {
    var AssetPickerView, Modal;
    Modal = (function(_super) {

      __extends(Modal, _super);

      function Modal() {
        return Modal.__super__.constructor.apply(this, arguments);
      }

      Modal.prototype.ui = {
        'title': '.modal-header h3',
        'content': '.js-content'
      };

      Modal.prototype.setContent = function(key, title) {
        var _this = this;
        if (title == null) {
          title = '';
        }
        _.each(this.panes, function(pane) {
          if (pane !== _this.panes[key]) {
            return pane.$el.hide();
          }
        });
        this.panes[key].show(this);
        if (title) {
          return this.setTitle(title);
        }
      };

      Modal.prototype.setTitle = function(html) {
        return this.ui.title.html(html);
      };

      Modal.prototype.close = function() {
        return this.remove();
      };

      Modal.prototype.onBackdropClick = function() {
        return this.close();
      };

      Modal.prototype.onClick = function(e) {
        return e.stopPropagation();
      };

      Modal.prototype.onCloseModalClick = function() {
        return this.close();
      };

      Modal.prototype.onRender = function() {
        var _this = this;
        return _.each(this.panes, function(pane) {
          pane.render();
          return _this.ui.content.append(pane.$el);
        });
      };

      return Modal;

    })(Marionette.ItemView);
    return AssetPickerView = (function(_super) {

      __extends(AssetPickerView, _super);

      function AssetPickerView() {
        return AssetPickerView.__super__.constructor.apply(this, arguments);
      }

      AssetPickerView.prototype.className = 'assets-modal modal';

      AssetPickerView.prototype.template = template;

      AssetPickerView.prototype.events = {
        'click': 'onClick',
        'click .js-close-modal': 'onCloseModalClick',
        'click .modal-backdrop': 'onBackdropClick'
      };

      AssetPickerView.prototype.initialize = function(options) {
        this.result = options.result;
        this.files = options.files;
        this.listenTo(this.collection, 'select', this.onAssetsSelect, this);
        return this.panes = {
          'uploadRegion': new AssetUploadView({
            collection: this.collection,
            files: this.files,
            type: options.type
          }),
          'browseRegion': new AssetBrowseView({
            collection: this.collection,
            type: options.type
          })
        };
      };

      AssetPickerView.prototype.onAssetsSelect = function(model) {
        this.result(model);
        return this.close();
      };

      AssetPickerView.prototype.onRender = function() {
        AssetPickerView.__super__.onRender.apply(this, arguments);
        if (this.files) {
          return this.setContent('uploadRegion', 'Upload Assets');
        } else {
          return this.setContent('browseRegion', 'Browse Assets');
        }
      };

      return AssetPickerView;

    })(Modal);
  });

}).call(this);

(function() {

  define('messages/handlers/asset_select',['cdn.jquery', 'views/asset_picker/asset_picker'], function($, AssetPickerView) {
    return function(message, options) {
      var assets, callback, mediator, view;
      mediator = this;
      callback = function(result) {
        var changed;
        if (!_.isUndefined(result)) {
          changed = {};
          changed[message.as] = _.extend(result.toJSON(), {
            representations: result.representations.toJSON()
          });
          if (options != null ? options.gadgetId : void 0) {
            return mediator.triggerGadgetEvent(options.gadgetId, 'change', changed);
          }
        }
      };
      assets = new vs.api.Assets;
      view = new AssetPickerView({
        collection: assets,
        result: callback,
        type: message.type,
        files: message.files
      });
      view.render();
      return $('body').append(view.$el);
    };
  });

}).call(this);

define('css-parse',[],function() {

  return function(css, options){
  options = options || {};

  /**
   * Positional.
   */

  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   */

  function updatePosition(str) {
    var lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf('\n');
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   */

  function position() {
    var start = { line: lineno, column: column };
    if (!options.position) return positionNoop;

    return function(node){
      node.position = {
        start: start,
        end: { line: lineno, column: column }
      };

      whitespace();
      return node;
    }
  }

  /**
   * Return `node`.
   */

  function positionNoop(node) {
    whitespace();
    return node;
  }

  /**
   * Parse stylesheet.
   */

  function stylesheet() {
    return {
      type: 'stylesheet',
      stylesheet: {
        rules: rules()
      }
    };
  }

  /**
   * Opening brace.
   */

  function open() {
    return match(/^{\s*/);
  }

  /**
   * Closing brace.
   */

  function close() {
    return match(/^}/);
  }

  /**
   * Parse ruleset.
   */

  function rules() {
    var node;
    var rules = [];
    whitespace();
    comments(rules);
    while (css[0] != '}' && (node = atrule() || rule())) {
      rules.push(node);
      comments(rules);
    }
    return rules;
  }

  /**
   * Match `re` and return captures.
   */

  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */

  function whitespace() {
    match(/^\s*/);
  }

  /**
   * Parse comments;
   */

  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) rules.push(c);
    return rules;
  }

  /**
   * Parse comment.
   */

  function comment() {
    var pos = position();
    if ('/' != css[0] || '*' != css[1]) return;

    var i = 2;
    while (null != css[i] && ('*' != css[i] || '/' != css[i + 1])) ++i;
    i += 2;

    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: 'comment',
      comment: str
    });
  }

  /**
   * Parse selector.
   */

  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;
    return m[0].trim().split(/\s*,\s*/);
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-\w]+)\s*/);
    if (!prop) return;
    prop = prop[0];

    // :
    if (!match(/^:\s*/)) return;

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);
    if (!val) return;

    var ret = pos({
      type: 'declaration',
      property: prop,
      value: val[0].trim()
    });

    // ;
    match(/^[;\s]*/);
    return ret;
  }

  /**
   * Parse declarations.
   */

  function declarations() {
    var decls = [];

    if (!open()) return;
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      comments(decls);
    }

    if (!close()) return;
    return decls;
  }

  /**
   * Parse keyframe.
   */

  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    while (m = match(/^(from|to|\d+%|\.\d+%|\d+\.\d+%)\s*/)) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations()
    });
  }

  /**
   * Parse keyframes.
   */

  function atkeyframes() {
    var pos = position();
    var m = match(/^@([-\w]+)?keyframes */);

    if (!m) return;
    var vendor = m[1];

    // identifier
    var m = match(/^([-\w]+)\s*/);
    if (!m) return;
    var name = m[1];

    if (!open()) return;
    comments();

    var frame;
    var frames = [];
    while (frame = keyframe()) {
      frames.push(frame);
      comments();
    }

    if (!close()) return;

    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames
    });
  }

  /**
   * Parse supports.
   */

  function atsupports() {
    var pos = position();
    var m = match(/^@supports *([^{]+)/);

    if (!m) return;
    var supports = m[1].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'supports',
      supports: supports,
      rules: style
    });
  }

  /**
   * Parse media.
   */

  function atmedia() {
    var pos = position();
    var m = match(/^@media *([^{]+)/);

    if (!m) return;
    var media = m[1].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }

  /**
   * Parse paged media.
   */

  function atpage() {
    var pos = position();
    var m = match(/^@page */);
    if (!m) return;

    var sel = selector() || [];
    var decls = [];

    if (!open()) return;
    comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      comments();
    }

    if (!close()) return;

    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  /**
   * Parse document.
   */

  function atdocument() {
    var pos = position();
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    var vendor = (m[1] || '').trim();
    var doc = m[2].trim();

    if (!open()) return;
    comments();

    var style = rules();

    if (!close()) return;

    return pos({
      type: 'document',
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  /**
   * Parse import
   */

  function atimport() {
    return _atrule('import');
  }

  /**
   * Parse charset
   */

  function atcharset() {
    return _atrule('charset');
  }

  /**
   * Parse namespace
   */

  function atnamespace() {
    return _atrule('namespace')
  }

  /**
   * Parse non-block at-rules
   */

  function _atrule(name) {
    var pos = position();
    var m = match(new RegExp('^@' + name + ' *([^;\\n]+);'));
    if (!m) return;
    var ret = { type: name };
    ret[name] = m[1].trim();
    return pos(ret);
  }

  /**
   * Parse at rule.
   */

  function atrule() {
    return atkeyframes()
      || atmedia()
      || atsupports()
      || atimport()
      || atcharset()
      || atnamespace()
      || atdocument()
      || atpage();
  }

  /**
   * Parse rule.
   */

  function rule() {
    var pos = position();
    var sel = selector();

    if (!sel) return;
    comments();

    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return stylesheet();
};

});

define('css-stringify',[],function() {

Compressed = (function() {

function Compiler(options) {
  options = options || {};
}

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('');
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node){
  return this[node.type](node);
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  if (this.compress) return '';
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return '@import ' + node.import + ';';
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return '@media '
    + node.media
    + '{'
    + node.rules.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return doc
    + '{'
    + node.rules.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return '@charset ' + node.charset + ';';
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return '@supports '
    + node.supports
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return '@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name
    + '{'
    + node.keyframes.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return node.values.join(',')
    + '{'
    + decls.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return '@page ' + sel
    + '{\n'
    + this.indent(1)
    + node.declarations.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var decls = node.declarations;
  if (!decls.length) return '';

  return node.selectors.join(',')
    + '{'
    + decls.map(this.visit, this).join('')
    + '}';
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return node.property + ':' + node.value + ';';
};

return Compiler;
})();

Identity = (function() {

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
  this.indentation = options.indent;
}

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('\n\n');
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node){
  return this[node.type](node);
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  return this.indent() + '/*' + node.comment + '*/';
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return '@import ' + node.import + ';';
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return '@media '
    + node.media
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return doc + ' '
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return '@charset ' + node.charset + ';\n';
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return '@supports '
    + node.supports
    + ' {\n'
    + this.indent(1)
    + node.rules.map(this.visit, this).join('\n\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return '@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name
    + ' {\n'
    + this.indent(1)
    + node.keyframes.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '}';
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.indent()
    + node.values.join(', ')
    + ' {\n'
    + this.indent(1)
    + decls.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}\n';
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return '@page ' + sel
    + '{\n'
    + this.indent(1)
    + node.declarations.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n}';
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return '';

  return node.selectors.map(function(s){ return indent + s }).join(',\n')
    + ' {\n'
    + this.indent(1)
    + decls.map(this.visit, this).join('\n')
    + this.indent(-1)
    + '\n' + this.indent() + '}';
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.indent() + node.property + ': ' + node.value + ';';
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function(level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return '';
  }

  return Array(this.level).join(this.indentation || '  ');
};

return Compiler;
})();

/**
 * Stringfy the given AST `node`.
 *
 * @param {Object} node
 * @param {Object} [options]
 * @return {String}
 * @api public
 */

return function(node, options){
  options = options || {};

  var compiler = options.compress
    ? new Compressed(options)
    : new Identity(options);

  return compiler.compile(node);
};

});

(function() {

  define('messages/handlers/style_register',['css-parse', 'css-stringify'], function(parse, stringify) {
    var handler,
      _this = this;
    handler = function(message, options) {
      var files, href, key, xhr;
      if (!(href = message.href)) {
        return;
      }
      key = message.key;
      files = message.files;
      xhr = $.get(href, {
        dataType: 'text'
      });
      return xhr.done(_.wrap(handler.addStyle, function(func, data) {
        return func(data, key, files);
      }));
    };
    handler.namespaceSelector = function(key, selector) {
      return key + ' ' + selector;
    };
    handler.namespaceRules = function(key, rules) {
      var rule, s, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = rules.length; _i < _len; _i++) {
        rule = rules[_i];
        if (rule.selectors != null) {
          _results.push(rule.selectors = (function() {
            var _j, _len1, _ref, _results1;
            _ref = rule.selectors;
            _results1 = [];
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              s = _ref[_j];
              _results1.push(handler.namespaceSelector(key, s));
            }
            return _results1;
          })());
        } else if (rule.rules != null) {
          _results.push(handler.namespaceRules(key, rule.rules));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    handler.namespaceCss = function(key, data) {
      var ast;
      ast = parse(data);
      handler.namespaceRules(key, ast.stylesheet.rules);
      return stringify(ast, {
        compress: true
      });
    };
    handler.rewriteAssetUrls = function(css, files) {
      _.each(files, function(cdnFile, localFile) {
        return css = css.replace(localFile, cdnFile);
      });
      return css;
    };
    handler.addStyle = function(data, key, files) {
      var $style, cssClass;
      cssClass = "style-" + key;
      $style = $("style." + cssClass);
      if ($style.length < 1) {
        $style = $('<style />').addClass(cssClass);
      }
      data = handler.rewriteAssetUrls(data, files);
      $style.text(handler.namespaceCss("." + key, data));
      return $style.appendTo('body');
    };
    return handler;
  });

}).call(this);

define('text!templates/inline_catalogue_item.html',[],function () { return '<img src=\'<%= icon %>\' class=\'icon\'>\n<div class=\'title\'><%= title %></div>\n<div class=\'author\'>Versal Group</div>\n<div class=\'version\'><%= version %></div>\n';});

define('text!templates/inline_catalogue.html',[],function () { return '<h2>\n  Choose a gadget:\n  <button class=\'btn cancel\'>Cancel</button>\n</h2>\n<ul class=\'items\'></ul>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('collections/gadget_catalogue',['plugins/vs.api'], function() {
    var GadgetCatalogue;
    return GadgetCatalogue = (function(_super) {

      __extends(GadgetCatalogue, _super);

      function GadgetCatalogue() {
        return GadgetCatalogue.__super__.constructor.apply(this, arguments);
      }

      GadgetCatalogue.prototype.initialize = function() {
        GadgetCatalogue.__super__.initialize.apply(this, arguments);
        this._isReady = false;
        return this.once('sync', this.onFirstSync, this);
      };

      GadgetCatalogue.prototype.isReady = function() {
        return this._isReady;
      };

      GadgetCatalogue.prototype.onFirstSync = function() {
        if (!this._isReady) {
          this._isReady = true;
          return this.trigger('ready');
        }
      };

      GadgetCatalogue.prototype.findGadgetByType = function(type) {
        return this.find(function(gadget) {
          return gadget.get('type') === type;
        });
      };

      GadgetCatalogue.prototype.buildInstanceOfType = function(type, opts) {
        var gadget, instance;
        if (!(gadget = this.findGadgetByType(type))) {
          throw new vs.api.errors.ApplicationError("Unknown gadget type " + type);
        }
        instance = new vs.api.GadgetInstance;
        instance.gadgetProject = gadget;
        instance.set({
          type: type
        });
        return instance;
      };

      return GadgetCatalogue;

    })(vs.api.GadgetProjects);
  });

}).call(this);

define('text!gadgets/section/template.html',[],function () { return '';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('gadgets/section/gadget',['text!./template.html'], function(template) {
    var SectionHeader;
    return SectionHeader = (function() {

      SectionHeader.prototype.className = 'section-header';

      function SectionHeader(facade, properties, $el) {
        this.facade = facade;
        this.properties = properties;
        this.$el = $el;
        this.onKeyUp = __bind(this.onKeyUp, this);

        this.facade.on('toggleEdit', this.onToggleEdit, this);
        this.facade.on('configChange', this.onConfigChange, this);
        this.facade.on('domReady', this.render, this);
        this.debouncedSave = _.debounce(this.save, 1000);
      }

      SectionHeader.prototype.onToggleEdit = function(editable) {
        this.text.toggleEdit(editable);
        return this.$el.focus();
      };

      SectionHeader.prototype.onConfigChange = function(properties) {
        this.properties = properties;
        return this.text.setText(this.properties.content);
      };

      SectionHeader.prototype.render = function() {
        var _this = this;
        this.$el.addClass(this.className);
        this.text = new vs.ui.EditableText({
          el: this.$el,
          type: 'input',
          complete: function() {
            return _this.finishEditing();
          }
        });
        if (this.properties.content) {
          return this.text.setText(this.properties.content);
        }
      };

      SectionHeader.prototype.finishEditing = function() {
        this.text.toggleEdit(false);
        this.properties.content = this.text.getPretty();
        return this.save();
      };

      SectionHeader.prototype.onKeyUp = function(e) {
        this.properties.content = this.text.getPretty();
        switch (e.keyCode) {
          case 9:
            e.preventDefault();
            break;
          case 27:
            e.preventDefault();
            this.save();
            this.text.toggleEdit(false);
            this.facade.trigger('doneEditing');
        }
        return this.debouncedSave();
      };

      SectionHeader.prototype.save = function() {
        return this.facade.trigger('save', this.properties);
      };

      return SectionHeader;

    })();
  });

}).call(this);

define('text!gadgets/column/template.html',[],function () { return '<h2>\n  2-Column Gadget\n  <button class=\'btn highlightChildren\'>Highlight Children</button>\n</h2>\n<div class=\'column first\' data-col=\'first\'>\n  <button class=\'btn chooseChild\'>Choose a child</button>\n  <div class=\'payload\'></div>\n</div>\n\n<div class=\'column second\' data-col=\'second\'>\n  <button class=\'btn chooseChild\'>Choose a child</button>\n  <div class=\'payload\'></div>\n</div>\n\n<div class=\'clearfix\'></div>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('gadgets/column/gadget',['text!./template.html'], function(template) {
    var Column;
    return Column = (function() {

      Column.prototype.className = 'column-gadget';

      function Column(facade, properties, $el) {
        this.facade = facade;
        this.properties = properties;
        this.$el = $el;
        this.highlightChildren = __bind(this.highlightChildren, this);

        this.addFacade = __bind(this.addFacade, this);

        this.chooseChild = __bind(this.chooseChild, this);

        this.facade.on('toggleEdit', this.onToggleEdit, this);
        this.facade.on('configChange', this.onConfigChange, this);
        this.facade.on('domReady', this.render, this);
        this.debouncedSave = _.debounce(this.save, 1000);
        this.childFacades = [];
      }

      Column.prototype.onToggleEdit = function(editable) {};

      Column.prototype.onConfigChange = function(properties) {
        this.properties = properties;
      };

      Column.prototype.render = function() {
        this.$el.html(template);
        this.facade.trigger('gadget:showChild', {
          el: this.$el.find('.first .payload'),
          name: 'first',
          success: this.addFacade
        });
        this.facade.trigger('gadget:showChild', {
          el: this.$el.find('.second .payload'),
          name: 'second',
          success: this.addFacade
        });
        this.$el.find('.chooseChild').on('click', this.chooseChild);
        return this.$el.find('.highlightChildren').on('click', this.highlightChildren);
      };

      Column.prototype.chooseChild = function(e) {
        var column, payload, target;
        target = $(e.currentTarget);
        column = target.parent().data('col');
        payload = target.siblings('.payload');
        return this.facade.trigger('gadget:pickChild', {
          el: payload,
          name: column,
          success: this.addFacade
        });
      };

      Column.prototype.addFacade = function(f) {
        var _this = this;
        if (_.contains(this.childFacades, f)) {
          return;
        }
        this.childFacades.push(f);
        return f.on('local:highlightParent', function() {
          _this.$el.css({
            background: 'lightblue'
          });
          return setTimeout(function() {
            return _this.$el.css({
              background: 'whitesmoke'
            });
          }, 500);
        });
      };

      Column.prototype.highlightChildren = function() {
        return _.each(this.childFacades, function(f) {
          return f.trigger('highlightSelf');
        });
      };

      Column.prototype.save = function() {
        return this.facade.trigger('save', this.properties);
      };

      return Column;

    })();
  });

}).call(this);

define('text!gadgets/lipsum/template.html',[],function () { return '  <h1>Lorem Ipsum</h1>\n  <button class=\'highlightParent btn\'>Highlight Parent Gadget</button>\n  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quae quo sunt excelsiores, eo dant clariora indicia naturae. Non enim quaero quid verum, sed quid cuique dicendum sit. Idemne potest esse dies saepius, qui semel fuit? Aliter homines, aliter philosophos loqui putas oportere? Omnia contraria, quos etiam insanos esse vultis. Illa videamus, quae a te de amicitia dicta sunt. </p>\n\n  <p>Dempta enim aeternitate nihilo beatior Iuppiter quam Epicurus; Unum nescio, quo modo possit, si luxuriosus sit, finitas cupiditates habere. Itaque hoc frequenter dici solet a vobis, non intellegere nos, quam dicat Epicurus voluptatem. Inscite autem medicinae et gubernationis ultimum cum ultimo sapientiae comparatur. Et quidem iure fortasse, sed tamen non gravissimum est testimonium multitudinis. Urgent tamen et nihil remittunt. Huius ego nunc auctoritatem sequens idem faciam. </p>\n\n  <p>Paulum, cum regem Persem captum adduceret, eodem flumine invectio? Nec lapathi suavitatem acupenseri Galloni Laelius anteponebat, sed suavitatem ipsam neglegebat; Murenam te accusante defenderem. Negabat igitur ullam esse artem, quae ipsa a se proficisceretur; Quamquam te quidem video minime esse deterritum. Illum mallem levares, quo optimum atque humanissimum virum, Cn. </p>\n\n  <p>Duo Reges: constructio interrete. Sed potestne rerum maior esse dissensio? Illis videtur, qui illud non dubitant bonum dicere -; Nam Pyrrho, Aristo, Erillus iam diu abiecti. Ergo omni animali illud, quod appetiti positum est in eo, quod naturae est accommodatum. Sic exclusis sententiis reliquorum cum praeterea nulla esse possit, haec antiquorum valeat necesse est. Non est ista, inquam, Piso, magna dissensio. Nonne igitur tibi videntur, inquit, mala? </p>\n';});

(function() {

  define('gadgets/lipsum/gadget',['text!./template.html'], function(template) {
    var Lipsum;
    return Lipsum = (function() {

      Lipsum.prototype.className = 'lipsum-gadget';

      function Lipsum(facade, properties, $el) {
        this.facade = facade;
        this.properties = properties;
        this.$el = $el;
        this.facade.on('domReady', this.render, this);
        this.facade.on('local:highlightSelf', this.highlightSelf, this);
      }

      Lipsum.prototype.render = function() {
        var _this = this;
        this.$el.html(template);
        return this.$el.find('.highlightParent').on('click', function() {
          return _this.facade.trigger('highlightParent');
        });
      };

      Lipsum.prototype.highlightSelf = function() {
        var _this = this;
        this.$el.css({
          background: 'lightgreen'
        });
        return setTimeout(function() {
          return _this.$el.css({
            background: 'whitesmoke'
          });
        }, 500);
      };

      return Lipsum;

    })();
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('app/catalogue',['collections/gadget_catalogue', 'gadgets/section/gadget', 'gadgets/column/gadget', 'gadgets/lipsum/gadget'], function(GadgetCatalogue, SectionGadget, ColumnGadget, LipsumGadget) {
    var CombinedCatalogue, localGadgets;
    localGadgets = new GadgetCatalogue([
      {
        catalog: "approved",
        hidden: true,
        icon: "http://placekitten.com/100/100",
        classDefinition: SectionGadget,
        id: "section",
        title: "Sections",
        type: "gadget/section",
        version: "0.0.0"
      }, {
        catalog: "approved",
        icon: "http://f.cl.ly/items/3p2A0A0W0Q2y1Q0j1U0l/Screen%20Shot%202013-05-30%20at%204.26.25%20PM.png",
        classDefinition: ColumnGadget,
        id: "column-gadget",
        title: "Columns",
        type: "column-gadget",
        version: "0.0.1"
      }, {
        catalog: "approved",
        icon: "http://www.karatepkf.com/media/11786/lorem-ipsum-logo.jpg",
        classDefinition: LipsumGadget,
        id: "lipsum-gadget",
        title: "Lorem Ipsum",
        type: "lipsum-gadget",
        version: "0.0.1"
      }
    ]);
    CombinedCatalogue = (function(_super) {

      __extends(CombinedCatalogue, _super);

      function CombinedCatalogue() {
        return CombinedCatalogue.__super__.constructor.apply(this, arguments);
      }

      CombinedCatalogue.prototype.fetchAll = function(opts) {
        var approved, unapproved,
          _this = this;
        if (opts == null) {
          opts = {};
        }
        approved = new GadgetCatalogue;
        unapproved = new GadgetCatalogue;
        return $.when(approved.fetchApproved(), unapproved.fetchUnapproved()).then(function() {
          _this.add(approved.reject(function(g) {
            return !g.isValid();
          }));
          _this.add(unapproved.reject(function(g) {
            return !g.isValid();
          }));
          _this.add(localGadgets.toJSON());
          _.each(_this.models, function(model) {
            model.css || (model.css = '');
            return model.main || (model.main = '');
          });
          _this.trigger('reset');
          return _this.trigger('sync');
        });
      };

      return CombinedCatalogue;

    })(GadgetCatalogue);
    return new CombinedCatalogue;
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/inline_catalogue',['cdn.marionette', 'text!templates/inline_catalogue_item.html', 'text!templates/inline_catalogue.html', 'app/catalogue', 'app/mediator'], function(Marionette, itemTemplate, template, gadgetCatalogue, mediator) {
    var InlineCatalogueItem, InlineCatalogueView;
    InlineCatalogueItem = (function(_super) {

      __extends(InlineCatalogueItem, _super);

      function InlineCatalogueItem() {
        return InlineCatalogueItem.__super__.constructor.apply(this, arguments);
      }

      InlineCatalogueItem.prototype.tagName = 'li';

      InlineCatalogueItem.prototype.template = _.template(itemTemplate);

      InlineCatalogueItem.prototype.events = {
        click: 'select'
      };

      InlineCatalogueItem.prototype.select = function() {
        return this.trigger('select');
      };

      return InlineCatalogueItem;

    })(Marionette.ItemView);
    return InlineCatalogueView = (function(_super) {

      __extends(InlineCatalogueView, _super);

      function InlineCatalogueView() {
        return InlineCatalogueView.__super__.constructor.apply(this, arguments);
      }

      InlineCatalogueView.prototype.className = 'inlineCatalogue';

      InlineCatalogueView.prototype.itemView = InlineCatalogueItem;

      InlineCatalogueView.prototype.itemViewContainer = '.items';

      InlineCatalogueView.prototype.initialize = function() {
        this.collection = gadgetCatalogue;
        return this.on('itemview:select', this.createInstance);
      };

      InlineCatalogueView.prototype.events = function() {
        return {
          'click .cancel': 'onCancelClick'
        };
      };

      InlineCatalogueView.prototype.onCancelClick = function() {
        return this.trigger('selectCanceled');
      };

      InlineCatalogueView.prototype.createInstance = function(view) {
        return this.trigger('selectGadget', view.model.get('type'));
      };

      InlineCatalogueView.prototype.template = function() {
        return _.template(template);
      };

      return InlineCatalogueView;

    })(Marionette.CompositeView);
  });

}).call(this);

(function() {

  define('messages/handlers/inline_catalogue_show',['views/inline_catalogue'], function(InlineCatalogueView) {
    return function(el, shownCallback, hiddenCallback) {
      var catalogue,
        _this = this;
      catalogue = new InlineCatalogueView;
      el.html(catalogue.render().el);
      shownCallback(catalogue);
      return catalogue.on('selectCanceled', function() {
        catalogue.remove();
        return hiddenCallback(catalogue);
      });
    };
  });

}).call(this);

(function() {

  define('app/mediator',['messages/mediator', 'messages/handlers/asset_select', 'messages/handlers/style_register', 'messages/handlers/inline_catalogue_show'], function(Mediator, assetSelectHandler, styleRegisterHandler, inlineCatalogueHandler) {
    var handlers, mediator;
    mediator = new Mediator;
    handlers = {
      'asset:select': assetSelectHandler,
      'style:register': styleRegisterHandler,
      'inlineCatalogue:show': inlineCatalogueHandler
    };
    _.each(handlers, function(handler, signal) {
      return mediator.on(signal, handler, mediator);
    });
    return mediator;
  });

}).call(this);

(function() {
  var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('messages/facade',['cdn.backbone', 'app/mediator'], function(Backbone, mediator) {
    var Facade, locals;
    locals = ['change', 'configure', 'configChange', 'doneEditing', 'domReady', 'save', 'toggleEdit', 'registerPropertySheet', 'render'];
    return Facade = (function() {

      function Facade(options) {
        var _this = this;
        this._gadgetId = options.gadgetId;
        mediator.on("gadget:" + this._gadgetId + ":change", function(attributes) {
          return _this.event('trigger', 'configChange', attributes);
        });
      }

      Facade.prototype.event = function(method, event, content, options) {
        return Backbone.Events[method].call(this, event, content, options);
      };

      Facade.prototype.on = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return this.event.apply(this, ['on'].concat(__slice.call(args)));
      };

      Facade.prototype.off = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return this.event.apply(this, ['off'].concat(__slice.call(args)));
      };

      Facade.prototype.trigger = function(event, content, opts) {
        var options;
        if (opts == null) {
          opts = {};
        }
        options = _.extend({}, opts, {
          gadgetId: this._gadgetId
        });
        if (__indexOf.call(locals, event) >= 0) {
          return this.event('trigger', event, content, options);
        } else {
          this.event('trigger', "local:" + event, content, options);
          return mediator.trigger(event, content, options);
        }
      };

      return Facade;

    })();
  });

}).call(this);

define('text!templates/property_sheet.html',[],function () { return '<div class="properties-dialog-arrow"></div>\n\n<div class="properties-dialog-header">\n  Properties\n\n  <div class="properties-dialog-error-count js-error-count-container">\n    <span class="js-error-count">1</span>\n    error<span class="js-error-count-plural">s</span>\n  </div>\n</div>\n\n<div class="js-form"></div>\n';});

/**
 * Backbone Forms v0.12.0
 *
 * NOTE:
 * This version is for use with RequireJS
 * If using regular <script> tags to include your files, use backbone-forms.min.js
 *
 * Copyright (c) 2013 Charles Davison, Pow Media Ltd
 * 
 * License and more information at:
 * http://github.com/powmedia/backbone-forms
 */
define('libs/backbone-forms',['cdn.jquery', 'cdn.underscore', 'cdn.backbone'], function($, _, Backbone) {

  
//==================================================================================================
//FORM
//==================================================================================================

var Form = Backbone.View.extend({

  /**
   * Constructor
   * 
   * @param {Object} [options.schema]
   * @param {Backbone.Model} [options.model]
   * @param {Object} [options.data]
   * @param {String[]|Object[]} [options.fieldsets]
   * @param {String[]} [options.fields]
   * @param {String} [options.idPrefix]
   * @param {Form.Field} [options.Field]
   * @param {Form.Fieldset} [options.Fieldset]
   * @param {Function} [options.template]
   */
  initialize: function(options) {
    var self = this;

    options = options || {};

    //Find the schema to use
    var schema = this.schema = (function() {
      //Prefer schema from options
      if (options.schema) return _.result(options, 'schema');

      //Then schema on model
      var model = options.model;
      if (model && model.schema) {
        return (_.isFunction(model.schema)) ? model.schema() : model.schema;
      }

      //Then built-in schema
      if (self.schema) {
        return (_.isFunction(self.schema)) ? self.schema() : self.schema;
      }

      //Fallback to empty schema
      return {};
    })();

    //Store important data
    _.extend(this, _.pick(options, 'model', 'data', 'idPrefix'));

    //Override defaults
    var constructor = this.constructor;
    this.template = options.template || constructor.template;
    this.Fieldset = options.Fieldset || constructor.Fieldset;
    this.Field = options.Field || constructor.Field;
    this.NestedField = options.NestedField || constructor.NestedField;

    //Check which fields will be included (defaults to all)
    var selectedFields = this.selectedFields = options.fields || _.keys(schema);

    //Create fields
    var fields = this.fields = {};

    _.each(selectedFields, function(key) {
      var fieldSchema = schema[key];
      fields[key] = this.createField(key, fieldSchema);
    }, this);

    //Create fieldsets
    var fieldsetSchema = options.fieldsets || [selectedFields],
        fieldsets = this.fieldsets = [];

    _.each(fieldsetSchema, function(itemSchema) {
      this.fieldsets.push(this.createFieldset(itemSchema));
    }, this);
  },

  /**
   * Creates a Fieldset instance
   *
   * @param {String[]|Object[]} schema       Fieldset schema
   *
   * @return {Form.Fieldset}
   */
  createFieldset: function(schema) {
    var options = {
      schema: schema,
      fields: this.fields
    };

    return new this.Fieldset(options);
  },

  /**
   * Creates a Field instance
   *
   * @param {String} key
   * @param {Object} schema       Field schema
   *
   * @return {Form.Field}
   */
  createField: function(key, schema) {
    var options = {
      form: this,
      key: key,
      schema: schema,
      idPrefix: this.idPrefix
    };

    if (this.model) {
      options.model = this.model;
    } else if (this.data) {
      options.value = this.data[key];
    } else {
      options.value = null;
    }

    var field = new this.Field(options);

    this.listenTo(field.editor, 'all', this.handleEditorEvent);

    return field;
  },

  /**
   * Callback for when an editor event is fired.
   * Re-triggers events on the form as key:event and triggers additional form-level events
   *
   * @param {String} event
   * @param {Editor} editor
   */
  handleEditorEvent: function(event, editor) {
    //Re-trigger editor events on the form
    var formEvent = editor.key+':'+event;

    this.trigger.call(this, formEvent, this, editor);

    //Trigger additional events
    switch (event) {
      case 'change':
        this.trigger('change', this);
        break;

      case 'focus':
        if (!this.hasFocus) this.trigger('focus', this);
        break;

      case 'blur':
        if (this.hasFocus) {
          //TODO: Is the timeout etc needed?
          var self = this;
          setTimeout(function() {
            var focusedField = _.find(self.fields, function(field) {
              return field.editor.hasFocus;
            });

            if (!focusedField) self.trigger('blur', self);
          }, 0);
        }
        break;
    }
  },

  render: function() {
    var self = this,
        fields = this.fields;

    //Render form
    var $form = $($.trim(this.template(_.result(this, 'templateData'))));

    //Render standalone editors
    $form.find('[data-editors]').add($form).each(function(i, el) {
      var $container = $(el),
          selection = $container.attr('data-editors');

      if (_.isUndefined(selection)) return;

      //Work out which fields to include
      var keys = (selection == '*')
        ? self.selectedFields || _.keys(fields)
        : selection.split(',');

      //Add them
      _.each(keys, function(key) {
        var field = fields[key];

        $container.append(field.editor.render().el);
      });
    });

    //Render standalone fields
    $form.find('[data-fields]').add($form).each(function(i, el) {
      var $container = $(el),
          selection = $container.attr('data-fields');

      if (_.isUndefined(selection)) return;

      //Work out which fields to include
      var keys = (selection == '*')
        ? self.selectedFields || _.keys(fields)
        : selection.split(',');

      //Add them
      _.each(keys, function(key) {
        var field = fields[key];

        $container.append(field.render().el);
      });
    });

    //Render fieldsets
    $form.find('[data-fieldsets]').add($form).each(function(i, el) {
      var $container = $(el),
          selection = $container.attr('data-fieldsets');

      if (_.isUndefined(selection)) return;

      _.each(self.fieldsets, function(fieldset) {
        $container.append(fieldset.render().el);
      });
    });

    //Set the main element
    this.setElement($form);

    return this;
  },

  /**
   * Validate the data
   *
   * @return {Object}       Validation errors
   */
  validate: function() {
    var self = this,
        fields = this.fields,
        model = this.model,
        errors = {};

    //Collect errors from schema validation
    _.each(fields, function(field) {
      var error = field.validate();
      if (error) {
        errors[field.key] = error;
      }
    });

    //Get errors from default Backbone model validator
    if (model && model.validate) {
      var modelErrors = model.validate(this.getValue());

      if (modelErrors) {
        var isDictionary = _.isObject(modelErrors) && !_.isArray(modelErrors);

        //If errors are not in object form then just store on the error object
        if (!isDictionary) {
          errors._others = errors._others || [];
          errors._others.push(modelErrors);
        }

        //Merge programmatic errors (requires model.validate() to return an object e.g. { fieldKey: 'error' })
        if (isDictionary) {
          _.each(modelErrors, function(val, key) {
            //Set error on field if there isn't one already
            if (fields[key] && !errors[key]) {
              fields[key].setError(val);
              errors[key] = val;
            }

            else {
              //Otherwise add to '_others' key
              errors._others = errors._others || [];
              var tmpErr = {};
              tmpErr[key] = val;
              errors._others.push(tmpErr);
            }
          });
        }
      }
    }

    return _.isEmpty(errors) ? null : errors;
  },

  /**
   * Update the model with all latest values.
   *
   * @param {Object} [options]  Options to pass to Model#set (e.g. { silent: true })
   *
   * @return {Object}  Validation errors
   */
  commit: function(options) {
    //Validate
    var errors = this.validate();
    if (errors) return errors;

    //Commit
    var modelError;

    var setOptions = _.extend({
      error: function(model, e) {
        modelError = e;
      }
    }, options);

    this.model.set(this.getValue(), setOptions);
    
    if (modelError) return modelError;
  },

  /**
   * Get all the field values as an object.
   * Use this method when passing data instead of objects
   *
   * @param {String} [key]    Specific field value to get
   */
  getValue: function(key) {
    //Return only given key if specified
    if (key) return this.fields[key].getValue();

    //Otherwise return entire form
    var values = {};
    _.each(this.fields, function(field) {
      values[field.key] = field.getValue();
    });

    return values;
  },

  /**
   * Update field values, referenced by key
   *
   * @param {Object|String} key     New values to set, or property to set
   * @param val                     Value to set
   */
  setValue: function(prop, val) {
    var data = {};
    if (typeof prop === 'string') {
      data[prop] = val;
    } else {
      data = prop;
    }

    var key;
    for (key in this.schema) {
      if (data[key] !== undefined) {
        this.fields[key].setValue(data[key]);
      }
    }
  },

  /**
   * Returns the editor for a given field key
   *
   * @param {String} key
   *
   * @return {Editor}
   */
  getEditor: function(key) {
    var field = this.fields[key];
    if (!field) throw 'Field not found: '+key;

    return field.editor;
  },

  /**
   * Gives the first editor in the form focus
   */
  focus: function() {
    if (this.hasFocus) return;

    //Get the first field
    var fieldset = this.fieldsets[0],
        field = fieldset.getFieldAt(0);

    if (!field) return;

    //Set focus
    field.editor.focus();
  },

  /**
   * Removes focus from the currently focused editor
   */
  blur: function() {
    if (!this.hasFocus) return;

    var focusedField = _.find(this.fields, function(field) {
      return field.editor.hasFocus;
    });

    if (focusedField) focusedField.editor.blur();
  },

  /**
   * Manages the hasFocus property
   *
   * @param {String} event
   */
  trigger: function(event) {
    if (event === 'focus') {
      this.hasFocus = true;
    }
    else if (event === 'blur') {
      this.hasFocus = false;
    }

    return Backbone.View.prototype.trigger.apply(this, arguments);
  },

  /**
   * Override default remove function in order to remove embedded views
   *
   * TODO: If editors are included directly with data-editors="x", they need to be removed
   * May be best to use XView to manage adding/removing views
   */
  remove: function() {
    _.each(this.fieldsets, function(fieldset) {
      fieldset.remove();
    });

    _.each(this.fields, function(field) {
      field.remove();
    });

    Backbone.View.prototype.remove.call(this);
  }

}, {

  //STATICS
  template: _.template('\
    <form data-fieldsets></form>\
  ', null, this.templateSettings),

  templateSettings: {
    evaluate: /<%([\s\S]+?)%>/g, 
    interpolate: /<%=([\s\S]+?)%>/g, 
    escape: /<%-([\s\S]+?)%>/g
  },

  editors: {}

});

  
//==================================================================================================
//VALIDATORS
//==================================================================================================

Form.validators = (function() {

  var validators = {};

  validators.errMessages = {
    required: 'Required',
    regexp: 'Invalid',
    email: 'Invalid email address',
    url: 'Invalid URL',
    match: _.template('Must match field "<%= field %>"', null, Form.templateSettings)
  };
  
  validators.required = function(options) {
    options = _.extend({
      type: 'required',
      message: this.errMessages.required
    }, options);
     
    return function required(value) {
      options.value = value;
      
      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };
      
      if (value === null || value === undefined || value === false || value === '') return err;
    };
  };
  
  validators.regexp = function(options) {
    if (!options.regexp) throw new Error('Missing required "regexp" option for "regexp" validator');
  
    options = _.extend({
      type: 'regexp',
      message: this.errMessages.regexp
    }, options);
    
    return function regexp(value) {
      options.value = value;
      
      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };
      
      //Don't check empty values (add a 'required' validator for this)
      if (value === null || value === undefined || value === '') return;

      if (!options.regexp.test(value)) return err;
    };
  };
  
  validators.email = function(options) {
    options = _.extend({
      type: 'email',
      message: this.errMessages.email,
      regexp: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
    }, options);
    
    return validators.regexp(options);
  };
  
  validators.url = function(options) {
    options = _.extend({
      type: 'url',
      message: this.errMessages.url,
      regexp: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
    }, options);
    
    return validators.regexp(options);
  };
  
  validators.match = function(options) {
    if (!options.field) throw new Error('Missing required "field" options for "match" validator');
    
    options = _.extend({
      type: 'match',
      message: this.errMessages.match
    }, options);
    
    return function match(value, attrs) {
      options.value = value;
      
      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };
      
      //Don't check empty values (add a 'required' validator for this)
      if (value === null || value === undefined || value === '') return;
      
      if (value !== attrs[options.field]) return err;
    };
  };


  return validators;

})();


//==================================================================================================
//FIELDSET
//==================================================================================================

Form.Fieldset = Backbone.View.extend({

  /**
   * Constructor
   *
   * Valid fieldset schemas:
   *   ['field1', 'field2']
   *   { legend: 'Some Fieldset', fields: ['field1', 'field2'] }
   *
   * @param {String[]|Object[]} options.schema      Fieldset schema
   * @param {Object} options.fields           Form fields
   */
  initialize: function(options) {
    options = options || {};

    //Create the full fieldset schema, merging defaults etc.
    var schema = this.schema = this.createSchema(options.schema);

    //Store the fields for this fieldset
    this.fields = _.pick(options.fields, schema.fields);
    
    //Override defaults
    this.template = options.template || this.constructor.template;
  },

  /**
   * Creates the full fieldset schema, normalising, merging defaults etc.
   *
   * @param {String[]|Object[]} schema
   *
   * @return {Object}
   */
  createSchema: function(schema) {
    //Normalise to object
    if (_.isArray(schema)) {
      schema = { fields: schema };
    }

    //Add null legend to prevent template error
    schema.legend = schema.legend || null;

    return schema;
  },

  /**
   * Returns the field for a given index
   *
   * @param {Number} index
   *
   * @return {Field}
   */
  getFieldAt: function(index) {
    var key = this.schema.fields[index];

    return this.fields[key];
  },

  /**
   * Returns data to pass to template
   *
   * @return {Object}
   */
  templateData: function() {
    return this.schema;
  },

  /**
   * Renders the fieldset and fields
   *
   * @return {Fieldset} this
   */
  render: function() {
    var schema = this.schema,
        fields = this.fields;

    //Render fieldset
    var $fieldset = $($.trim(this.template(_.result(this, 'templateData'))));

    //Render fields
    $fieldset.find('[data-fields]').add($fieldset).each(function(i, el) {
      var $container = $(el),
          selection = $container.attr('data-fields');

      if (_.isUndefined(selection)) return;

      _.each(fields, function(field) {
        $container.append(field.render().el);
      });
    });

    this.setElement($fieldset);

    return this;
  },

  /**
   * Remove embedded views then self
   */
  remove: function() {
    _.each(this.fields, function(field) {
      field.remove();
    });

    Backbone.View.prototype.remove.call(this);
  }
  
}, {
  //STATICS

  template: _.template('\
    <fieldset data-fields>\
      <% if (legend) { %>\
        <legend><%= legend %></legend>\
      <% } %>\
    </fieldset>\
  ', null, Form.templateSettings)

});


//==================================================================================================
//FIELD
//==================================================================================================

Form.Field = Backbone.View.extend({

  /**
   * Constructor
   * 
   * @param {Object} options.key
   * @param {Object} options.form
   * @param {Object} [options.schema]
   * @param {Function} [options.schema.template]
   * @param {Backbone.Model} [options.model]
   * @param {Object} [options.value]
   * @param {String} [options.idPrefix]
   * @param {Function} [options.template]
   * @param {Function} [options.errorClassName]
   */
  initialize: function(options) {
    options = options || {};

    //Store important data
    _.extend(this, _.pick(options, 'form', 'key', 'model', 'value', 'idPrefix'));

    //Create the full field schema, merging defaults etc.
    var schema = this.schema = this.createSchema(options.schema);

    //Override defaults
    this.template = options.template || schema.template || this.constructor.template;
    this.errorClassName = options.errorClassName || this.constructor.errorClassName;

    //Create editor
    this.editor = this.createEditor();
  },

  /**
   * Creates the full field schema, merging defaults etc.
   *
   * @param {Object|String} schema
   *
   * @return {Object}
   */
  createSchema: function(schema) {
    if (_.isString(schema)) schema = { type: schema };

    //Set defaults
    schema = _.extend({
      type: 'Text',
      title: this.createTitle()
    }, schema);

    //Get the real constructor function i.e. if type is a string such as 'Text'
    schema.type = (_.isString(schema.type)) ? Form.editors[schema.type] : schema.type;

    return schema;
  },

  /**
   * Creates the editor specified in the schema; either an editor string name or
   * a constructor function
   *
   * @return {View}
   */
  createEditor: function() {
    var options = _.extend(
      _.pick(this, 'schema', 'form', 'key', 'model', 'value'),
      { id: this.createEditorId() }
    );

    var constructorFn = this.schema.type;

    return new constructorFn(options);
  },

  /**
   * Creates the ID that will be assigned to the editor
   *
   * @return {String}
   */
  createEditorId: function() {
    var prefix = this.idPrefix,
        id = this.key;

    //Replace periods with underscores (e.g. for when using paths)
    id = id.replace(/\./g, '_');

    //If a specific ID prefix is set, use it
    if (_.isString(prefix) || _.isNumber(prefix)) return prefix + id;
    if (_.isNull(prefix)) return id;

    //Otherwise, if there is a model use it's CID to avoid conflicts when multiple forms are on the page
    if (this.model) return this.model.cid + '_' + id;

    return id;
  },

  /**
   * Create the default field title (label text) from the key name.
   * (Converts 'camelCase' to 'Camel Case')
   *
   * @return {String}
   */
  createTitle: function() {
    var str = this.key;

    //Add spaces
    str = str.replace(/([A-Z])/g, ' $1');

    //Uppercase first character
    str = str.replace(/^./, function(str) { return str.toUpperCase(); });

    return str;
  },

  /**
   * Returns the data to be passed to the template
   *
   * @return {Object}
   */
  templateData: function() {
    var schema = this.schema;

    return {
      help: schema.help || '',
      title: schema.title,
      fieldAttrs: schema.fieldAttrs,
      editorAttrs: schema.editorAttrs,
      key: this.key,
      editorId: this.editor.id
    };
  },

  /**
   * Render the field and editor
   *
   * @return {Field} self
   */
  render: function() {
    var schema = this.schema,
        editor = this.editor;

    //Render field
    var $field = $($.trim(this.template(_.result(this, 'templateData'))));

    if (schema.fieldClass) $field.addClass(schema.fieldClass);
    if (schema.fieldAttrs) $field.attr(schema.fieldAttrs);

    //Render editor
    $field.find('[data-editor]').add($field).each(function(i, el) {
      var $container = $(el),
          selection = $container.attr('data-editor');

      if (_.isUndefined(selection)) return;

      $container.append(editor.render().el);
    });

    this.setElement($field);

    return this;
  },

  /**
   * Check the validity of the field
   *
   * @return {String}
   */
  validate: function() {
    var error = this.editor.validate();

    if (error) {
      this.setError(error.message);
    } else {
      this.clearError();
    }

    return error;
  },

  /**
   * Set the field into an error state, adding the error class and setting the error message
   *
   * @param {String} msg     Error message
   */
  setError: function(msg) {
    //Nested form editors (e.g. Object) set their errors internally
    if (this.editor.hasNestedForm) return;

    //Add error CSS class
    this.$el.addClass(this.errorClassName);

    //Set error message
    this.$('[data-error]').html(msg);
  },

  /**
   * Clear the error state and reset the help message
   */
  clearError: function() {
    //Remove error CSS class
    this.$el.removeClass(this.errorClassName);

    //Clear error message
    this.$('[data-error]').empty();
  },

  /**
   * Update the model with the new value from the editor
   *
   * @return {Mixed}
   */
  commit: function() {
    return this.editor.commit();
  },

  /**
   * Get the value from the editor
   *
   * @return {Mixed}
   */
  getValue: function() {
    return this.editor.getValue();
  },

  /**
   * Set/change the value of the editor
   *
   * @param {Mixed} value
   */
  setValue: function(value) {
    this.editor.setValue(value);
  },

  /**
   * Give the editor focus
   */
  focus: function() {
    this.editor.focus();
  },

  /**
   * Remove focus from the editor
   */
  blur: function() {
    this.editor.blur();
  },

  /**
   * Remove the field and editor views
   */
  remove: function() {
    this.editor.remove();

    Backbone.View.prototype.remove.call(this);
  }

}, {
  //STATICS

  template: _.template('\
    <div>\
      <label for="<%= editorId %>"><%= title %></label>\
      <div>\
        <span data-editor></span>\
        <div data-error></div>\
        <div><%= help %></div>\
      </div>\
    </div>\
  ', null, Form.templateSettings),

  /**
   * CSS class name added to the field when there is a validation error
   */
  errorClassName: 'error'

});


//==================================================================================================
//NESTEDFIELD
//==================================================================================================

Form.NestedField = Form.Field.extend({

  template: _.template($.trim('\
    <div>\
      <span data-editor></span>\
      <% if (help) { %>\
        <div><%= help %></div>\
      <% } %>\
      <div data-error></div>\
    </div>\
  '), null, Form.templateSettings)

});

/**
 * Base editor (interface). To be extended, not used directly
 *
 * @param {Object} options
 * @param {String} [options.id]         Editor ID
 * @param {Model} [options.model]       Use instead of value, and use commit()
 * @param {String} [options.key]        The model attribute key. Required when using 'model'
 * @param {Mixed} [options.value]       When not using a model. If neither provided, defaultValue will be used
 * @param {Object} [options.schema]     Field schema; may be required by some editors
 * @param {Object} [options.validators] Validators; falls back to those stored on schema
 * @param {Object} [options.form]       The form
 */
Form.Editor = Form.editors.Base = Backbone.View.extend({

  defaultValue: null,

  hasFocus: false,

  initialize: function(options) {
    var options = options || {};

    //Set initial value
    if (options.model) {
      if (!options.key) throw "Missing option: 'key'";

      this.model = options.model;

      this.value = this.model.get(options.key);
    }
    else if (options.value) {
      this.value = options.value;
    }

    if (this.value === undefined) this.value = this.defaultValue;

    //Store important data
    _.extend(this, _.pick(options, 'key', 'form'));

    var schema = this.schema = options.schema || {};

    this.validators = options.validators || schema.validators;

    //Main attributes
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());
    if (schema.editorClass) this.$el.addClass(schema.editorClass);
    if (schema.editorAttrs) this.$el.attr(schema.editorAttrs);
  },

  /**
   * Get the value for the form input 'name' attribute
   *
   * @return {String}
   *
   * @api private
   */
  getName: function() {
    var key = this.key || '';

    //Replace periods with underscores (e.g. for when using paths)
    return key.replace(/\./g, '_');
  },

  /**
   * Get editor value
   * Extend and override this method to reflect changes in the DOM
   *
   * @return {Mixed}
   */
  getValue: function() {
    return this.value;
  },

  /**
   * Set editor value
   * Extend and override this method to reflect changes in the DOM
   *
   * @param {Mixed} value
   */
  setValue: function(value) {
    this.value = value;
  },

  /**
   * Give the editor focus
   * Extend and override this method
   */
  focus: function() {
    throw 'Not implemented';
  },
  
  /**
   * Remove focus from the editor
   * Extend and override this method
   */
  blur: function() {
    throw 'Not implemented';
  },

  /**
   * Update the model with the current value
   *
   * @param {Object} [options]              Options to pass to model.set()
   * @param {Boolean} [options.validate]    Set to true to trigger built-in model validation
   *
   * @return {Mixed} error
   */
  commit: function(options) {
    var error = this.validate();
    if (error) return error;

    this.listenTo(this.model, 'invalid', function(model, e) {
      error = e;
    });
    this.model.set(this.key, this.getValue(), options);

    if (error) return error;
  },

  /**
   * Check validity
   *
   * @return {Object|Undefined}
   */
  validate: function() {
    var $el = this.$el,
        error = null,
        value = this.getValue(),
        formValues = this.form ? this.form.getValue() : {},
        validators = this.validators,
        getValidator = this.getValidator;

    if (validators) {
      //Run through validators until an error is found
      _.every(validators, function(validator) {
        error = getValidator(validator)(value, formValues);

        return error ? false : true;
      });
    }

    return error;
  },

  /**
   * Set this.hasFocus, or call parent trigger()
   *
   * @param {String} event
   */
  trigger: function(event) {
    if (event === 'focus') {
      this.hasFocus = true;
    }
    else if (event === 'blur') {
      this.hasFocus = false;
    }

    return Backbone.View.prototype.trigger.apply(this, arguments);
  },

  /**
   * Returns a validation function based on the type defined in the schema
   *
   * @param {RegExp|String|Function} validator
   * @return {Function}
   */
  getValidator: function(validator) {
    var validators = Form.validators;

    //Convert regular expressions to validators
    if (_.isRegExp(validator)) {
      return validators.regexp({ regexp: validator });
    }
    
    //Use a built-in validator if given a string
    if (_.isString(validator)) {
      if (!validators[validator]) throw new Error('Validator "'+validator+'" not found');
      
      return validators[validator]();
    }

    //Functions can be used directly
    if (_.isFunction(validator)) return validator;

    //Use a customised built-in validator if given an object
    if (_.isObject(validator) && validator.type) {
      var config = validator;
      
      return validators[config.type](config);
    }
    
    //Unkown validator type
    throw new Error('Invalid validator: ' + validator);
  }
});

/**
 * Text
 * 
 * Text input with focus, blur and change events
 */
Form.editors.Text = Form.Editor.extend({

  tagName: 'input',

  defaultValue: '',

  previousValue: '',

  events: {
    'keyup':    'determineChange',
    'keypress': function(event) {
      var self = this;
      setTimeout(function() {
        self.determineChange();
      }, 0);
    },
    'select':   function(event) {
      this.trigger('select', this);
    },
    'focus':    function(event) {
      this.trigger('focus', this);
    },
    'blur':     function(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    var schema = this.schema;

    //Allow customising text type (email, phone etc.) for HTML5 browsers
    var type = 'text';

    if (schema && schema.editorAttrs && schema.editorAttrs.type) type = schema.editorAttrs.type;
    if (schema && schema.dataType) type = schema.dataType;

    this.$el.attr('type', type);
  },

  /**
   * Adds the editor to the DOM
   */
  render: function() {
    this.setValue(this.value);

    return this;
  },

  determineChange: function(event) {
    var currentValue = this.$el.val();
    var changed = (currentValue !== this.previousValue);

    if (changed) {
      this.previousValue = currentValue;

      this.trigger('change', this);
    }
  },

  /**
   * Returns the current editor value
   * @return {String}
   */
  getValue: function() {
    return this.$el.val();
  },

  /**
   * Sets the value of the form element
   * @param {String}
   */
  setValue: function(value) {
    this.$el.val(value);
    this.previousValue = this.$el.val();
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$el.blur();
  },

  select: function() {
    this.$el.select();
  }

});

/**
 * TextArea editor
 */
Form.editors.TextArea = Form.editors.Text.extend({

  tagName: 'textarea'

});

/**
 * Password editor
 */
Form.editors.Password = Form.editors.Text.extend({

  initialize: function(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    this.$el.attr('type', 'password');
  }

});

/**
 * NUMBER
 * 
 * Normal text input that only allows a number. Letters etc. are not entered.
 */
Form.editors.Number = Form.editors.Text.extend({

  defaultValue: 0,

  events: _.extend({}, Form.editors.Text.prototype.events, {
    'keypress': 'onKeyPress',
    'input':    'determineChange'
  }),

  initialize: function(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    this.$el.attr('type', 'number');
    this.$el.attr('step', 'any');
  },

  /**
   * Check value is numeric
   */
  onKeyPress: function(event) {
    var self = this,
        delayedDetermineChange = function() {
          setTimeout(function() {
            self.determineChange();
          }, 0);
        };

    //Allow backspace
    if (event.charCode === 0) {
      delayedDetermineChange();
      return;
    }

    //Get the whole new value so that we can prevent things like double decimals points etc.
    var newVal = this.$el.val() + String.fromCharCode(event.charCode);

    var numeric = /^-?[0-9]*\.?[0-9]*$/.test(newVal);

    if (numeric) {
      delayedDetermineChange();
    }
    else {
      event.preventDefault();
    }
  },

  getValue: function() {
    var value = this.$el.val();

    return value === "" ? null : parseFloat(value, 10);
  },

  setValue: function(value) {
    value = (function() {
      if (_.isNumber(value)) return value;

      if (_.isString(value) && value !== '') return parseFloat(value, 10);

      return null;
    })();

    if (_.isNaN(value)) value = null;

    Form.editors.Text.prototype.setValue.call(this, value);
  }

});

/**
 * Hidden editor
 */
Form.editors.Hidden = Form.editors.Base.extend({

  defaultValue: '',

  initialize: function(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    this.$el.attr('type', 'hidden');
  },

  focus: function() {

  },

  blur: function() {

  }

});

/**
 * Checkbox editor
 *
 * Creates a single checkbox, i.e. boolean value
 */
Form.editors.Checkbox = Form.editors.Base.extend({

  defaultValue: false,

  tagName: 'input',

  events: {
    'click':  function(event) {
      this.trigger('change', this);
    },
    'focus':  function(event) {
      this.trigger('focus', this);
    },
    'blur':   function(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    this.$el.attr('type', 'checkbox');
  },

  /**
   * Adds the editor to the DOM
   */
  render: function() {
    this.setValue(this.value);

    return this;
  },

  getValue: function() {
    return this.$el.prop('checked');
  },

  setValue: function(value) {
    if (value) {
      this.$el.prop('checked', true);
    }
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$el.blur();
  }

});

/**
 * Select editor
 *
 * Renders a <select> with given options
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Select = Form.editors.Base.extend({

  tagName: 'select',

  events: {
    'change': function(event) {
      this.trigger('change', this);
    },
    'focus':  function(event) {
      this.trigger('focus', this);
    },
    'blur':   function(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    if (!this.schema || !this.schema.options) throw "Missing required 'schema.options'";
  },

  render: function() {
    this.setOptions(this.schema.options);

    return this;
  },

  /**
   * Sets the options that populate the <select>
   *
   * @param {Mixed} options
   */
  setOptions: function(options) {
    var self = this;

    //If a collection was passed, check if it needs fetching
    if (options instanceof Backbone.Collection) {
      var collection = options;

      //Don't do the fetch if it's already populated
      if (collection.length > 0) {
        this.renderOptions(options);
      } else {
        collection.fetch({
          success: function(collection) {
            self.renderOptions(options);
          }
        });
      }
    }

    //If a function was passed, run it to get the options
    else if (_.isFunction(options)) {
      options(function(result) {
        self.renderOptions(result);
      }, self);
    }

    //Otherwise, ready to go straight to renderOptions
    else {
      this.renderOptions(options);
    }
  },

  /**
   * Adds the <option> html to the DOM
   * @param {Mixed}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   *                      or as a string of <option> HTML to insert into the <select>
   */
  renderOptions: function(options) {
    var $select = this.$el,
        html;

    html = this._getOptionsHtml(options);

    //Insert options
    $select.html(html);

    //Select correct option
    this.setValue(this.value);
  },

  _getOptionsHtml: function(options) {
    var html;
    //Accept string of HTML
    if (_.isString(options)) {
      html = options;
    }

    //Or array
    else if (_.isArray(options)) {
      html = this._arrayToHtml(options);
    }

    //Or Backbone collection
    else if (options instanceof Backbone.Collection) {
      html = this._collectionToHtml(options);
    }

    else if (_.isFunction(options)) {
      var newOptions;
      
      options(function(opts) {
        newOptions = opts;
      }, this);
      
      html = this._getOptionsHtml(newOptions);
    }

    return html;
  },

  getValue: function() {
    return this.$el.val();
  },

  setValue: function(value) {
    this.$el.val(value);
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$el.blur();
  },

  /**
   * Transforms a collection into HTML ready to use in the renderOptions method
   * @param {Backbone.Collection}
   * @return {String}
   */
  _collectionToHtml: function(collection) {
    //Convert collection to array first
    var array = [];
    collection.each(function(model) {
      array.push({ val: model.id, label: model.toString() });
    });

    //Now convert to HTML
    var html = this._arrayToHtml(array);

    return html;
  },

  /**
   * Create the <option> HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function(array) {
    var html = [];

    //Generate HTML
    _.each(array, function(option) {
      if (_.isObject(option)) {
        if (option.group) {
          html.push('<optgroup label="'+option.group+'">');
          html.push(this._getOptionsHtml(option.options))
          html.push('</optgroup>');
        } else {
          var val = (option.val || option.val === 0) ? option.val : '';
          html.push('<option value="'+val+'">'+option.label+'</option>');
        }
      }
      else {
        html.push('<option>'+option+'</option>');
      }
    }, this);

    return html.join('');
  }

});

/**
 * Radio editor
 *
 * Renders a <ul> with given options represented as <li> objects containing radio buttons
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Radio = Form.editors.Select.extend({

  tagName: 'ul',

  events: {
    'change input[type=radio]': function() {
      this.trigger('change', this);
    },
    'focus input[type=radio]': function() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur input[type=radio]': function() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function() {
        if (self.$('input[type=radio]:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  getValue: function() {
    return this.$('input[type=radio]:checked').val();
  },

  setValue: function(value) {
    this.$('input[type=radio]').val([value]);
  },

  focus: function() {
    if (this.hasFocus) return;

    var checked = this.$('input[type=radio]:checked');
    if (checked[0]) {
      checked.focus();
      return;
    }

    this.$('input[type=radio]').first().focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$('input[type=radio]:focus').blur();
  },

  /**
   * Create the radio list HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function (array) {
    var html = [];
    var self = this;

    _.each(array, function(option, index) {
      var itemHtml = '<li>';
      if (_.isObject(option)) {
        var val = (option.val || option.val === 0) ? option.val : '';
        itemHtml += ('<input type="radio" name="'+self.id+'" value="'+val+'" id="'+self.id+'-'+index+'" />');
        itemHtml += ('<label for="'+self.id+'-'+index+'">'+option.label+'</label>');
      }
      else {
        itemHtml += ('<input type="radio" name="'+self.id+'" value="'+option+'" id="'+self.id+'-'+index+'" />');
        itemHtml += ('<label for="'+self.id+'-'+index+'">'+option+'</label>');
      }
      itemHtml += '</li>';
      html.push(itemHtml);
    });

    return html.join('');
  }

});

/**
 * Checkboxes editor
 *
 * Renders a <ul> with given options represented as <li> objects containing checkboxes
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Checkboxes = Form.editors.Select.extend({

  tagName: 'ul',

  events: {
    'click input[type=checkbox]': function() {
      this.trigger('change', this);
    },
    'focus input[type=checkbox]': function() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur input[type=checkbox]':  function() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function() {
        if (self.$('input[type=checkbox]:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  getValue: function() {
    var values = [];
    this.$('input[type=checkbox]:checked').each(function() {
      values.push($(this).val());
    });
    return values;
  },

  setValue: function(values) {
    if (!_.isArray(values)) values = [values];
    this.$('input[type=checkbox]').val(values);
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$('input[type=checkbox]').first().focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$('input[type=checkbox]:focus').blur();
  },

  /**
   * Create the checkbox list HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function (array) {
    var html = [];
    var self = this;

    _.each(array, function(option, index) {
      var itemHtml = '<li>';
      if (_.isObject(option)) {
        var val = (option.val || option.val === 0) ? option.val : '';
        itemHtml += ('<input type="checkbox" name="'+self.id+'" value="'+val+'" id="'+self.id+'-'+index+'" />');
        itemHtml += ('<label for="'+self.id+'-'+index+'">'+option.label+'</label>');
      }
      else {
        itemHtml += ('<input type="checkbox" name="'+self.id+'" value="'+option+'" id="'+self.id+'-'+index+'" />');
        itemHtml += ('<label for="'+self.id+'-'+index+'">'+option+'</label>');
      }
      itemHtml += '</li>';
      html.push(itemHtml);
    });

    return html.join('');
  }

});

/**
 * Object editor
 *
 * Creates a child form. For editing Javascript objects
 *
 * @param {Object} options
 * @param {Form} options.form                 The form this editor belongs to; used to determine the constructor for the nested form
 * @param {Object} options.schema             The schema for the object
 * @param {Object} options.schema.subSchema   The schema for the nested form
 */
Form.editors.Object = Form.editors.Base.extend({
  //Prevent error classes being set on the main control; they are internally on the individual fields
  hasNestedForm: true,

  initialize: function(options) {
    //Set default value for the instance so it's not a shared object
    this.value = {};

    //Init
    Form.editors.Base.prototype.initialize.call(this, options);

    //Check required options
    if (!this.form) throw 'Missing required option "form"';
    if (!this.schema.subSchema) throw new Error("Missing required 'schema.subSchema' option for Object editor");
  },

  render: function() {
    //Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    var NestedForm = this.form.constructor;

    //Create the nested form
    this.nestedForm = new NestedForm({
      schema: this.schema.subSchema,
      data: this.value,
      idPrefix: this.id + '_',
      Field: NestedForm.NestedField
    });

    this._observeFormEvents();

    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  getValue: function() {
    if (this.nestedForm) return this.nestedForm.getValue();

    return this.value;
  },

  setValue: function(value) {
    this.value = value;

    this.render();
  },

  focus: function() {
    if (this.hasFocus) return;

    this.nestedForm.focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.nestedForm.blur();
  },

  remove: function() {
    this.nestedForm.remove();

    Backbone.View.prototype.remove.call(this);
  },

  validate: function() {
    return this.nestedForm.validate();
  },

  _observeFormEvents: function() {
    if (!this.nestedForm) return;
    
    this.nestedForm.on('all', function() {
      // args = ["key:change", form, fieldEditor]
      var args = _.toArray(arguments);
      args[1] = this;
      // args = ["key:change", this=objectEditor, fieldEditor]

      this.trigger.apply(this, args);
    }, this);
  }

});

/**
 * NestedModel editor
 *
 * Creates a child form. For editing nested Backbone models
 *
 * Special options:
 *   schema.model:   Embedded model constructor
 */
Form.editors.NestedModel = Form.editors.Object.extend({
  initialize: function(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    if (!this.form) throw 'Missing required option "form"';
    if (!options.schema.model) throw 'Missing required "schema.model" option for NestedModel editor';
  },

  render: function() {
    //Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    var NestedForm = this.form.constructor;

    var data = this.value || {},
        key = this.key,
        nestedModel = this.schema.model;

    //Wrap the data in a model if it isn't already a model instance
    var modelInstance = (data.constructor === nestedModel) ? data : new nestedModel(data);

    this.nestedForm = new NestedForm({
      model: modelInstance,
      idPrefix: this.id + '_',
      fieldTemplate: 'nestedField'
    });

    this._observeFormEvents();

    //Render form
    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * Update the embedded model, checking for nested validation errors and pass them up
   * Then update the main model if all OK
   *
   * @return {Error|null} Validation error or null
   */
  commit: function() {
    var error = this.nestedForm.commit();
    if (error) {
      this.$el.addClass('error');
      return error;
    }

    return Form.editors.Object.prototype.commit.call(this);
  }

});

/**
 * Date editor
 *
 * Schema options
 * @param {Number|String} [options.schema.yearStart]  First year in list. Default: 100 years ago
 * @param {Number|String} [options.schema.yearEnd]    Last year in list. Default: current year
 *
 * Config options (if not set, defaults to options stored on the main Date class)
 * @param {Boolean} [options.showMonthNames]  Use month names instead of numbers. Default: true
 * @param {String[]} [options.monthNames]     Month names. Default: Full English names
 */
Form.editors.Date = Form.editors.Base.extend({

  events: {
    'change select':  function() {
      this.updateHidden();
      this.trigger('change', this);
    },
    'focus select':   function() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur select':    function() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function() {
        if (self.$('select:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  initialize: function(options) {
    options = options || {};

    Form.editors.Base.prototype.initialize.call(this, options);

    var Self = Form.editors.Date,
        today = new Date();

    //Option defaults
    this.options = _.extend({
      monthNames: Self.monthNames,
      showMonthNames: Self.showMonthNames
    }, options);

    //Schema defaults
    this.schema = _.extend({
      yearStart: today.getFullYear() - 100,
      yearEnd: today.getFullYear()
    }, options.schema || {});

    //Cast to Date
    if (this.value && !_.isDate(this.value)) {
      this.value = new Date(this.value);
    }

    //Set default date
    if (!this.value) {
      var date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);

      this.value = date;
    }

    //Template
    this.template = options.template || this.constructor.template;
  },

  render: function() {
    var options = this.options,
        schema = this.schema;

    var datesOptions = _.map(_.range(1, 32), function(date) {
      return '<option value="'+date+'">' + date + '</option>';
    });

    var monthsOptions = _.map(_.range(0, 12), function(month) {
      var value = (options.showMonthNames)
          ? options.monthNames[month]
          : (month + 1);

      return '<option value="'+month+'">' + value + '</option>';
    });

    var yearRange = (schema.yearStart < schema.yearEnd)
      ? _.range(schema.yearStart, schema.yearEnd + 1)
      : _.range(schema.yearStart, schema.yearEnd - 1, -1);

    var yearsOptions = _.map(yearRange, function(year) {
      return '<option value="'+year+'">' + year + '</option>';
    });

    //Render the selects
    var $el = $($.trim(this.template({
      dates: datesOptions.join(''),
      months: monthsOptions.join(''),
      years: yearsOptions.join('')
    })));

    //Store references to selects
    this.$date = $el.find('[data-type="date"]');
    this.$month = $el.find('[data-type="month"]');
    this.$year = $el.find('[data-type="year"]');

    //Create the hidden field to store values in case POSTed to server
    this.$hidden = $('<input type="hidden" name="'+this.key+'" />');
    $el.append(this.$hidden);

    //Set value on this and hidden field
    this.setValue(this.value);

    //Remove the wrapper tag
    this.setElement($el);
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * @return {Date}   Selected date
   */
  getValue: function() {
    var year = this.$year.val(),
        month = this.$month.val(),
        date = this.$date.val();

    if (!year || !month || !date) return null;

    return new Date(year, month, date);
  },

  /**
   * @param {Date} date
   */
  setValue: function(date) {
    this.$date.val(date.getDate());
    this.$month.val(date.getMonth());
    this.$year.val(date.getFullYear());

    this.updateHidden();
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$('select').first().focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$('select:focus').blur();
  },

  /**
   * Update the hidden input which is maintained for when submitting a form
   * via a normal browser POST
   */
  updateHidden: function() {
    var val = this.getValue();

    if (_.isDate(val)) val = val.toISOString();

    this.$hidden.val(val);
  }

}, {
  //STATICS
  template: _.template('\
    <div>\
      <select data-type="date"><%= dates %></select>\
      <select data-type="month"><%= months %></select>\
      <select data-type="year"><%= years %></select>\
    </div>\
  ', null, Form.templateSettings),

  //Whether to show month names instead of numbers
  showMonthNames: true,

  //Month names to use if showMonthNames is true
  //Replace for localisation, e.g. Form.editors.Date.monthNames = ['Janvier', 'Fevrier'...]
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
});

/**
 * DateTime editor
 *
 * @param {Editor} [options.DateEditor]           Date editor view to use (not definition)
 * @param {Number} [options.schema.minsInterval]  Interval between minutes. Default: 15
 */
Form.editors.DateTime = Form.editors.Base.extend({

  events: {
    'change select':  function() {
      this.updateHidden();
      this.trigger('change', this);
    },
    'focus select':   function() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur select':    function() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function() {
        if (self.$('select:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  initialize: function(options) {
    options = options || {};

    Form.editors.Base.prototype.initialize.call(this, options);

    //Option defaults
    this.options = _.extend({
      DateEditor: Form.editors.DateTime.DateEditor
    }, options);

    //Schema defaults
    this.schema = _.extend({
      minsInterval: 15
    }, options.schema || {});

    //Create embedded date editor
    this.dateEditor = new this.options.DateEditor(options);

    this.value = this.dateEditor.value;

    //Template
    this.template = options.template || this.constructor.template;
  },

  render: function() {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    var schema = this.schema;

    //Create options
    var hoursOptions = _.map(_.range(0, 24), function(hour) {
      return '<option value="'+hour+'">' + pad(hour) + '</option>';
    });

    var minsOptions = _.map(_.range(0, 60, schema.minsInterval), function(min) {
      return '<option value="'+min+'">' + pad(min) + '</option>';
    });

    //Render time selects
    var $el = $($.trim(this.template({
      hours: hoursOptions.join(),
      mins: minsOptions.join()
    })));

    //Include the date editor
    $el.find('[data-date]').append(this.dateEditor.render().el);

    //Store references to selects
    this.$hour = $el.find('select[data-type="hour"]');
    this.$min = $el.find('select[data-type="min"]');

    //Get the hidden date field to store values in case POSTed to server
    this.$hidden = $el.find('input[type="hidden"]');

    //Set time
    this.setValue(this.value);

    this.setElement($el);
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * @return {Date}   Selected datetime
   */
  getValue: function() {
    var date = this.dateEditor.getValue();

    var hour = this.$hour.val(),
        min = this.$min.val();

    if (!date || !hour || !min) return null;

    date.setHours(hour);
    date.setMinutes(min);

    return date;
  },

  /**
   * @param {Date}
   */
  setValue: function(date) {
    if (!_.isDate(date)) date = new Date(date);

    this.dateEditor.setValue(date);

    this.$hour.val(date.getHours());
    this.$min.val(date.getMinutes());

    this.updateHidden();
  },

  focus: function() {
    if (this.hasFocus) return;

    this.$('select').first().focus();
  },

  blur: function() {
    if (!this.hasFocus) return;

    this.$('select:focus').blur();
  },

  /**
   * Update the hidden input which is maintained for when submitting a form
   * via a normal browser POST
   */
  updateHidden: function() {
    var val = this.getValue();
    if (_.isDate(val)) val = val.toISOString();

    this.$hidden.val(val);
  },

  /**
   * Remove the Date editor before removing self
   */
  remove: function() {
    this.dateEditor.remove();

    Form.editors.Base.prototype.remove.call(this);
  }

}, {
  //STATICS
  template: _.template('\
    <div class="bbf-datetime">\
      <div class="bbf-date-container" data-date></div>\
      <select data-type="hour"><%= hours %></select>\
      :\
      <select data-type="min"><%= mins %></select>\
    </div>\
  ', null, Form.templateSettings),

  //The date editor to use (constructor function, not instance)
  DateEditor: Form.editors.Date
});



  //Metadata
  Form.VERSION = '0.12.0';

  //Exports
  Backbone.Form = Form;

  return Form;
});


/*
Include this template file after backbone-forms.amd.js to override the default templates

'data-*' attributes control where elements are placed
*/


(function() {

  define('libs/backbone-forms.bootstrap',["cdn.jquery", "cdn.underscore", "cdn.backbone", "libs/backbone-forms"], function($, _, Backbone) {
    var Form;
    Form = Backbone.Form;
    /*
      Bootstrap templates for Backbone Forms
    */

    Form.template = _.template("<form class=\"form\" data-fieldsets></form>");
    Form.Fieldset.template = _.template("<fieldset class=\"bbf-fieldset\" data-fields>\n  <% if (legend) { %>\n    <legend><%= legend %></legend>\n  <% } %>\n</fieldset>");
    Form.Field.template = _.template("<div class=\"control-group field-<%= key %> bbf-field\">\n  <label class=\"control-label\" for=\"<%= editorId %>\"><%= title %></label>\n  <div class=\"bbf-editor\" data-editor></div>\n  <div class=\"bbf-error-tooltip-container\">\n    <div class=\"bff-error-tooltip versal-tooltip versal-tooltip-text versal-tooltip-left versal-tooltip-align-top\">\n      <div class=\"versal-tooltip-arrow\"></div>\n      <div class=\"bbf-error\" data-error></div>\n    </div>\n  </div>\n</div>");
    Form.editors.Date.template = _.template("<div class=\"bbf-date\">\n  <select data-type=\"date\" class=\"bbf-date\"><%= dates %></select>\n  <select data-type=\"month\" class=\"bbf-month\"><%= months %></select>\n  <select data-type=\"year\" class=\"bbf-year\"><%= years %></select>\n</div>");
    Form.editors.DateTime.template = _.template("<div class=\"bbf-datetime\">\n  <div class=\"bbf-date-container\" data-date></div>\n  <select data-type=\"hour\" style=\"width: 4em\"><%= hours %></select>\n  :\n  <select data-type=\"min\" style=\"width: 4em\"><%= mins %></select>\n</div>");
    return Form.Field.errorClassName = "bbf-error";
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/backbone-forms/color',['libs/backbone-forms'], function(Form) {
    return Form.editors.Color = (function(_super) {

      __extends(Color, _super);

      function Color() {
        return Color.__super__.constructor.apply(this, arguments);
      }

      Color.prototype.events = {
        'change  input[type=color]': 'onColorChange',
        'change  input[type=text]': 'onTextChange',
        'keyup   input[type=text]': 'onTextChange',
        'keydown input[type=text]': 'onTextChange',
        focus: 'onFocus',
        blur: 'onBlur'
      };

      Color.prototype.onColorChange = function() {
        this.color = this.$colorInput().val();
        this.$textInput().val(this.color);
        return this.trigger('change', this);
      };

      Color.prototype.onTextChange = function() {
        this.color = this.$textInput().val();
        this.$colorInput().val(this.color);
        return this.trigger('change', this);
      };

      Color.prototype.onFocus = function() {
        return this.trigger('focus', this);
      };

      Color.prototype.onBlur = function() {
        return this.trigger('blur', this);
      };

      Color.prototype.render = function() {
        this.$el.html(this.$colorInput());
        this.$el.append(this.$textInput());
        this.setValue(this.value);
        return this;
      };

      Color.prototype.$colorInput = function() {
        var _ref;
        return (_ref = this._colorInput) != null ? _ref : this._colorInput = $('<input class="input-color-color" type="color"></input>');
      };

      Color.prototype.$textInput = function() {
        var _ref;
        return (_ref = this._textInput) != null ? _ref : this._textInput = $('<input class="input-color-text" type="text"></input>');
      };

      Color.prototype.getValue = function() {
        return this.color;
      };

      Color.prototype.setValue = function(color) {
        this.color = color;
        this.$colorInput().val(this.color);
        return this.$textInput().val(this.color);
      };

      Color.prototype.focus = function() {
        if (!this.hasFocus) {
          return this.$colorInput().focus();
        }
      };

      Color.prototype.blur = function() {
        if (this.hasFocus) {
          return this.$colorInput().blur();
        }
      };

      return Color;

    })(Form.editors.Base);
  });

}).call(this);

// # clayer
// **clayer** is a lightweight library for highly interactive websites.
// It provides an abstraction for mouse and (multi-)touch events, and some high-level widgets.
// Clayer is based on the internal library of <worrydream.com>, Bret Victor's website, called *BVLayer* or *LayerScript*.
// You can pick and choose what you like from this library and adapt it to your own needs.
// We believe it is more useful to have a simple, readable library that you can fully understand and modify, than having a large and highly configurable library.

/*jshint jquery:true */
(function () {
  

  // ## Helper functions

  // Clayer uses the `clayer` global object.
  var clayer = {};
  window.clayer = clayer;

  // Modify `clayer.texts` to internationalize strings.
  clayer.texts = {
    drag: 'drag'
  };

  // `clayer.makeCall()` is used for only calling callbacks if they exist.
  clayer.makeCall = function(obj, func, args) {
    if (obj[func]) {
      return obj[func].apply(obj, args);
    }
  };

  // `clayer.setCss3()` can be used to apply proprietary CSS extensions.
  // The prefixes of the major browsers are added before the name of the attribute.
  // If `addBrowserToValue` is true, it is also added before the value, which is useful for some attributes such as transitions.
  clayer.setCss3 = function($element, name, value, addBrowserToValue) {
    addBrowserToValue = addBrowserToValue || false;
    var browsers = ['', '-ms-', '-moz-', '-webkit-', '-o-'];
    for (var i=0; i<browsers.length; i++) {
      var cssName = browsers[i] + name;
      var cssValue = (addBrowserToValue ? browsers[i] : '') + value;
      $element.css(cssName, cssValue);
    }
  };

  // `clayer.isTouch` is true or false depending on whether the browser supports touch events.
  clayer.isTouch = ('ontouchstart' in document.documentElement);

  // When `clayer.initBody()` is called, the body element is given a `clayer-body-touch` or `clayer-body-mouse` class, depending on `clayer.isTouch`.
  clayer.initBody = function() {
    if (clayer.isTouch) {
      $('body').addClass('clayer-body-touch');
    } else {
      $('body').addClass('clayer-body-mouse');
    }
  };

  // ## Touchable
  // `clayer.Touchable` provides an abstraction over touch and mouse events.
  // We make a distinction between hover and touch/click events. First we look at the latter.
  // 
  clayer.Touchable = function() { return this.init.apply(this, arguments); };
  clayer.Touchable.prototype = {
    init: function($element, callbacks) {
      this.$element = $element;
      this.$document = $($element[0].ownerDocument);
      this.callbacks = callbacks;

      this.mouseDown = $.proxy(this.mouseDown, this);
      this.mouseMove = $.proxy(this.mouseMove, this);
      this.mouseUp = $.proxy(this.mouseUp, this);
      this.touchStart = $.proxy(this.touchStart, this);
      this.touchMove = $.proxy(this.touchMove, this);
      this.touchEnd = $.proxy(this.touchEnd, this);
      this.hoverMove = $.proxy(this.hoverMove, this);
      this.hoverLeave = $.proxy(this.hoverLeave, this);

      this.documentEvents = {
        mousemove: this.mouseMove,
        mouseup: this.mouseUp,
        touchmove: this.touchMove,
        touchend: this.touchEnd,
        touchcancel: this.touchEnd
      };

      this.setTouchable(false);
      this.setHoverable(false);
    },

    remove: function() {
      this.setTouchable(false);
      this.setHoverable(false);
    },

    setTouchable: function(isTouchable) {
      if (this.isTouchable === isTouchable) return;
      this.isTouchable = isTouchable;
      this.touchEvent = null;

      if (isTouchable) {
        this.$element.on({
          mousedown: this.mouseDown,
          touchstart: this.touchStart
        });
      }
      else {
        this.$element.off('mousedown touchstart');
        this.$document.off(this.documentEvents);
        // CSS3 "pointer-events: none" here? (not supported by IE)
      }
    },

    setHoverable: function(isHoverable) {
      if (this.isHoverable === isHoverable) return;
      this.isHoverable = isHoverable;
      this.hoverEvent = null;

      if (isHoverable) {
        this.$element.on({
          mousemove: this.hoverMove,
          mouseleave: this.hoverLeave
        });
      }
      else {
        this.$element.off({
          mousemove: this.hoverMove,
          mouseleave: this.hoverLeave
        });
        // CSS3 "pointer-events: none" here? (not supported by IE)
      }
    },

    mouseDown: function(event) {
      if (this.isTouchable) {
        this.$document.on({
          mousemove: this.mouseMove,
          mouseup: this.mouseUp
        });
        
        this.touchEvent = new clayer.PositionEvent(this.$element, event, event.timeStamp, true);
        clayer.makeCall(this.callbacks, 'touchDown', [this.touchEvent]);
      }
      return false;
    },

    mouseMove: function(event) {
      if (this.isTouchable && this.touchEvent) {
        this.touchEvent.move(event, event.timeStamp);
        clayer.makeCall(this.callbacks, 'touchMove', [this.touchEvent]);
      }
      return false;
    },

    mouseUp: function(event) {
      if (this.isTouchable && this.touchEvent) {
        this.touchEvent.up(event, event.timeStamp);
        clayer.makeCall(this.callbacks, 'touchUp', [this.touchEvent]);
        this.touchEvent = null;
      }
      this.$document.off(this.documentEvents);
      return false;
    },

    touchStart: function(event) {
      this.$element.off({
        'mousedown': this.mouseDown,
        'mousemove': this.hoverMove,
        'mouseleave': this.hoverLeave
      }); // we're on a touch device (safer than checking using clayer.isTouch)

      if (!this.isTouchable || this.touchEvent || event.originalEvent.targetTouches.length > 1) {
        this.touchEnd(event);
      } else {
        this.$document.on({
          touchmove: this.touchMove,
          touchend: this.touchEnd,
          touchcancel: this.touchEnd
        });
      
        this.touchEvent = new clayer.PositionEvent(this.$element, event.originalEvent.targetTouches[0], event.timeStamp, false);
        clayer.makeCall(this.callbacks, 'touchDown', [this.touchEvent]);
      }
      return false;
    },

    touchMove: function(event) {
      if (this.isTouchable && this.touchEvent) {
        var touchEvent = this.findTouchEvent(event.originalEvent.touches);
        if (touchEvent === null) {
          this.touchEnd(event);
        } else {
          this.touchEvent.move(touchEvent, event.timeStamp);
          clayer.makeCall(this.callbacks, 'touchMove', [this.touchEvent]);
        }
      }
      return false;
    },

    touchEnd: function(event) {
      if (this.isTouchable && this.touchEvent) {
        this.touchEvent.up(this.findTouchEvent(event.originalEvent.touches), event.timeStamp);
        clayer.makeCall(this.callbacks, 'touchUp', [this.touchEvent]);
        this.touchEvent = null;
      }
      this.$document.off(this.documentEvents);
      return false;
    },

    hoverMove: function(event) {
      if (this.touchEvent) {
        this.mouseMove(event);
      } else if (this.isHoverable) {
        if (!this.hoverEvent) {
          this.hoverEvent = new clayer.PositionEvent(this.$element, event, true);
        } else {
          this.hoverEvent.move(event, event.timeStamp);
        }
        clayer.makeCall(this.callbacks, 'hoverMove', [this.hoverEvent]);
      }
      return false;
    },

    hoverLeave: function(event) {
      if (this.isHoverable && this.hoverEvent) {
        this.hoverEvent.move(event);
        clayer.makeCall(this.callbacks, 'hoverLeave', [this.hoverEvent]);
        this.hoverEvent = null;
      }
      return false;
    },

    findTouchEvent: function(touches) {
      for (var i=0; i<touches.length; i++) {
        if (touches[i].identifier === this.touchEvent.event.identifier) {
          return touches[i];
        }
      }
      return null;
    }
  };

  clayer.PositionEvent = function() { return this.init.apply(this, arguments); };
  clayer.PositionEvent.prototype = {
    init: function($element, event, timestamp, mouse) {
      this.$element = $element;
      this.globalPoint = { x: event.pageX, y: event.pageY };
      this.translation = { x: 0, y: 0 };
      this.deltaTranslation = { x: 0, y: 0 };
      this.localPoint = { x: 0, y: 0 };
      this.updateLocalPoint();

      this.event = event;
      this.startTimestamp = this.timestamp = timestamp;
      this.hasMoved = false;
      this.wasTap = false;
      this.mouse = mouse;
    },

    getTimeSinceGoingDown: function () {
      return this.timestamp - this.startTimestamp;
    },

    resetDeltaTranslation: function() {
      this.deltaTranslation.x = 0;
      this.deltaTranslation.y = 0;
    },

    inElement: function() {
      return this.localPoint.x >= 0 && this.localPoint.x <= this.$element.outerWidth() &&
        this.localPoint.y >= 0 && this.localPoint.y <= this.$element.outerHeight();
    },

    move: function(event, timestamp) {
      this.event = event;
      this.timestamp = timestamp;
      this.updatePositions();
    },

    up: function(event, timestamp) {
      this.event = event || this.event;
      this.timestamp = timestamp;
      this.wasTap = !this.hasMoved && (this.getTimeSinceGoingDown() < 300);
    },

    updatePositions: function() {
      var dx = this.event.pageX - this.globalPoint.x;
      var dy = this.event.pageY - this.globalPoint.y;
      this.translation.x += dx;
      this.translation.y += dy;
      this.deltaTranslation.x += dx;
      this.deltaTranslation.y += dy;
      this.globalPoint.x = this.event.pageX;
      this.globalPoint.y = this.event.pageY;
      this.updateLocalPoint();

      if (this.translation.x*this.translation.x + this.translation.y*this.translation.y > 200) this.hasMoved = true;
    },

    updateLocalPoint: function() {
      var offset = this.$element.offset();
      this.localPoint.x = this.globalPoint.x - offset.left;
      this.localPoint.y = this.globalPoint.y - offset.top;
    }
  };

  clayer.Scrubbable = function() { return this.init.apply(this, arguments); };
  clayer.Scrubbable.prototype = {
    init: function($element, callbacks) {
      this.$element = $element;
      this.callbacks = callbacks;
      this.touchable = new clayer.Touchable($element, this);
      this.setScrubbable(true);
    },

    remove: function() {
      this.touchable.remove();
    },

    setScrubbable: function(value) {
      this.touchable.setTouchable(value);
      this.touchable.setHoverable(value);
    },

    hoverMove: function(event) {
      clayer.makeCall(this.callbacks, 'scrubMove', [event.localPoint.x, event.localPoint.y, false]);
    },

    hoverLeave: function(event) {
      clayer.makeCall(this.callbacks, 'scrubLeave', []);
    },

    touchDown: function(event) {
      this.touchMove(event);
    },

    touchMove: function(event) {
      clayer.makeCall(this.callbacks, 'scrubMove', [event.localPoint.x, event.localPoint.y, true]);
    },

    touchUp: function(event) {
      if (!event.mouse || !event.inElement()) {
        clayer.makeCall(this.callbacks, 'scrubLeave', []);
      } else {
        this.hoverMove(event);
      }
      if (event.wasTap) {
        clayer.makeCall(this.callbacks, 'scrubTap', [event.localPoint.x, event.localPoint.y]);
      }
    }
  };

  clayer.Slider = function() { return this.init.apply(this, arguments); };
  clayer.Slider.prototype = {
    init: function($element, callbacks, valueWidth) {
      this.$element = $element;
      this.$element.addClass('clayer-slider');
      this.callbacks = callbacks;

      this.valueWidth = valueWidth || 1;
      this.markerValue = 0;
      this.knobValue = 0;

      this.$container = $('<div class="clayer-slider-container"></div>');
      this.$element.append(this.$container);

      this.$bar = $('<div class="clayer-slider-bar"></div>');
      this.$container.append(this.$bar);

      this.$segmentContainer = $('<div class="clayer-slider-segment-container"></div>');
      this.$bar.append(this.$segmentContainer);

      this.$marker = $('<div class="clayer-slider-marker"></div>');
      this.markerWidth = Math.min(this.valueWidth, 10);
      this.$marker.width(this.markerWidth);
      this.$bar.append(this.$marker);

      this.$knob = $('<div class="clayer-slider-knob"></div>');
      this.$container.append(this.$knob);

      this.scrubbable = new clayer.Scrubbable(this.$element, this);

      this.bounceTimer = null;

      this.renderKnob();
      this.renderMarker();
    },

    remove: function() {
      this.scrubbable.remove();
      this.$segmentContainer.remove();
      this.$marker.remove();
      this.$knob.remove();
      this.$bar.remove();
      this.$container.remove();
    },

    setSegments: function(ranges) {
      this.$segmentContainer.html('');
      for (var i=0; i<ranges.length; i++) {
        var range = ranges[i];
        var $segment = $('<div class="clayer-slider-segment"></div>');
        this.$segmentContainer.append($segment);

        $segment.css('left', range.start*this.valueWidth);
        $segment.width((range.end - range.start + 1)*this.valueWidth);
        $segment.css('background-color', range.color);
      }
    },

    setValue: function(value) {
      this.markerValue = this.knobValue = value;
      this.renderKnob();
      this.renderMarker();
    },

    setKnobValue: function(value) {
      this.knobValue = value;
      this.renderKnob();
    },

    changed: function(down) {
      clayer.makeCall(this.callbacks, 'sliderChanged', [this.knobValue, down]);
    },

    updateKnob: function(x) {
      x = Math.max(0, Math.min(this.$element.width()-1, x));
      this.updateKnobValue(Math.floor(x/this.valueWidth));
    },

    updateKnobValue: function(knobValue) {
      if (this.knobValue !== knobValue) {
        this.knobValue = knobValue;
        this.renderKnob();
        this.changed(false);
      }
    },

    updateMarker: function(x) {
      x = Math.max(0, Math.min(this.$element.width()-1, x));
      var markerValue = Math.floor(x/this.valueWidth);
      if (this.markerValue !== markerValue) {
        this.knobValue = this.markerValue = markerValue;
        this.renderKnob();
        this.renderMarker();
        this.changed(true);
      }
    },

    renderKnob: function() {
      this.$knob.css('left', (this.knobValue+0.5)*this.valueWidth);

      if (this.bounceTimer !== null) {
        this.bounceProgress = Math.min(this.bounceProgress + 0.04, 1);
        var p = this.bounceProgress;
        var jumpY = (p < 0.5) ? (15*(1-Math.pow(4*p-1, 2))) : (4*(1-Math.pow(4*(p-0.5)-1, 2)));
        this.$knob.css('top', -jumpY);
        if (this.bounceProgress >= 1) {
          clearInterval(this.bounceTimer);
          this.bounceTimer = null;
        }
      }
    },

    renderMarker: function() {
      this.$marker.css('left', (this.markerValue+0.5)*this.valueWidth - this.markerWidth/2);
    },

    scrubMove: function(x, y, down) {
      this.$knob.addClass('clayer-active');
      if (down) {
        this.$knob.addClass('clayer-pressed');
        this.updateMarker(x);
      } else {
        this.$knob.removeClass('clayer-pressed');
        this.updateKnob(x);
      }
    },

    scrubLeave: function() {
      this.$knob.removeClass('clayer-active clayer-pressed');
      this.updateKnobValue(this.markerValue);
      clayer.makeCall(this.callbacks, 'sliderLeave');
    },

    scrubTap: function() {
      if (this.bounceTimer === null) {
        this.bounceTimer = setInterval($.proxy(this.renderKnob, this), 20);
        this.bounceProgress = 0;
      }
    }
  };

  clayer.Draggable = function() { return this.init.apply(this, arguments); };
  clayer.Draggable.prototype = {
    init: function($element, callbacks, $parent) {
      this.$element = $element;
      this.callbacks = callbacks;
      this.$parent = $parent;
      this.touchable = new clayer.Touchable($element, this);
      this.setDraggable(true);
    },

    remove: function() {
      this.touchable.remove();
    },

    setDraggable: function(value) {
      this.touchable.setTouchable(value);
      this.touchable.setHoverable(false);
    },

    touchDown: function(event) {
      this.offsetX = event.localPoint.x + parseInt(this.$element.css('margin-left'), 10);
      this.offsetY = event.localPoint.y + parseInt(this.$element.css('margin-top'), 10);
      clayer.makeCall(this.callbacks, 'dragStart', [this.offsetX, this.offsetY]);
    },

    touchMove: function(event) {
      var x = event.globalPoint.x-this.offsetX, y = event.globalPoint.y-this.offsetY;

      if (this.$parent !== undefined) {
        var parentOffset = this.$parent.offset();
        x = Math.max(0, Math.min(this.$parent.outerWidth(), x-parentOffset.left));
        y = Math.max(0, Math.min(this.$parent.outerHeight(), y-parentOffset.top));
        this.$element.css('left', x);
        this.$element.css('top', y);
        clayer.makeCall(this.callbacks, 'dragMove', [x, y, event.globalPoint.x, event.globalPoint.y]);
      } else {
        clayer.makeCall(this.callbacks, 'dragMove', [x, y, event.globalPoint.x, event.globalPoint.y]);
      }
    },

    touchUp: function(event) {
      clayer.makeCall(this.callbacks, 'dragEnd');
      if (event.wasTap) {
        clayer.makeCall(this.callbacks, 'dragTap', [event.localPoint.x, event.localPoint.y]);
      }
    }
  };

  clayer.DragKnob = function() { return this.init.apply(this, arguments); };
  clayer.DragKnob.prototype = {
    init: function($element, callbacks, $parent) {
      this.$element = $element;
      this.$element.addClass('clayer-dragknob');
      this.$element.append('<div class="clayer-dragknob-label">' + clayer.texts.drag + '</div>');

      this.$parent = $parent;
      if (this.$parent !== undefined) {
        this.$parent.addClass('clayer-dragknob-parent');
      }

      this.callbacks = callbacks;
      this.draggable = new clayer.Draggable($element, this, $parent);
    },

    remove: function() {
      this.draggable.remove();
      this.$element.removeClass('clayer-dragknob');
      if (this.$parent !== undefined) {
        this.$parent.addClass('clayer-dragknob-parent');
      }
    },

    dragStart: function() {
      this.$element.addClass('clayer-pressed');
      this.$element.removeClass('clayer-dragknob-show-label');
      clayer.makeCall(this.callbacks, 'dragStart');
    },

    dragMove: function(x, y) {
      clayer.makeCall(this.callbacks, 'dragMove', arguments);
    },

    dragEnd: function() {
      this.$element.removeClass('clayer-pressed');
      clayer.makeCall(this.callbacks, 'dragEnd');
    },

    dragTap: function() {
      this.$element.addClass('clayer-dragknob-show-label');
      clayer.makeCall(this.callbacks, 'dragTap');
    }
  };
})();

define("clayer", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.clayer;
    };
}(this)));

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/backbone-forms/range',['cdn.jquery', 'libs/backbone-forms', 'clayer'], function($, Form, clayer) {
    return Form.editors.Range = (function(_super) {

      __extends(Range, _super);

      function Range() {
        return Range.__super__.constructor.apply(this, arguments);
      }

      Range.prototype.width = 210;

      Range.prototype.initialize = function(options) {
        Range.__super__.initialize.call(this, options);
        this.min = this.schema.min || 0;
        this.max = this.schema.max || 100;
        return this.step = this.schema.step || 1;
      };

      Range.prototype.render = function() {
        var range;
        this.$el.width(this.width);
        range = (this.max - this.min + 1) / this.step;
        this.slider = new clayer.Slider(this.$el, this, this.width / range);
        this.$knob = $('<div class="clayer-slider-knob-value"></div>');
        this.$('.clayer-slider-knob').append(this.$knob);
        this.setValue(this.value || 0);
        return this;
      };

      Range.prototype.sliderChanged = function(value) {
        this.sliderValue = Math.floor(value * this.step + this.min);
        this.updateKnob();
        return this.trigger('change', this);
      };

      Range.prototype.getValue = function() {
        return this.sliderValue;
      };

      Range.prototype.setValue = function(value) {
        this.sliderValue = value;
        this.slider.setValue((value - this.min) / this.step);
        return this.updateKnob();
      };

      Range.prototype.updateKnob = function() {
        return this.$knob.text(this.sliderValue);
      };

      Range.prototype.focus = function() {
        if (this.hasFocus) {

        }
      };

      Range.prototype.blur = function() {
        if (!this.hasFocus) {

        }
      };

      return Range;

    })(Form.editors.Base);
  });

}).call(this);

/* From https://github.com/Versal/Tags */

/** 
 * Simple autocomplete plugin
 * with full keyboard navigation. 
 * works great with the tagbox plugin
 * 
 * @author Bastian Allgeier <bastian@getkirby.com>
 * @copyright Bastian Allgeier 2012
 * @license MIT
 */
(function($) {

  $.autocomplete = function(element, url, options) {

    var defaults = {
      url : false,
      apply : function(string) { $element.val(string) }
    }

    var plugin = this;

    plugin.settings = {}

    var $element = $(element),
         element = element;

    plugin.init = function() {

      plugin.settings = $.extend({}, defaults, options);

      plugin.input  = $element;
      plugin.ignore = [];
      plugin.data   = {};     
      plugin.open   = false;

      plugin.load();
      
      plugin.blocker = $('<div class="autocomplete-blocker"></div>').css({'position' : 'fixed', 'top' : 0, 'left' : 0, 'right' : 0, 'bottom' : 0, 'z-index' : 1999}).hide();
      plugin.box     = $('<div class="autocomplete"></div>').css('z-index', 2000);
      plugin.tooltip = $('<div class="versal-tooltip versal-tooltip-white versal-tooltip-top versal-tooltip-align-left versal-tooltip-offset"><div class="versal-tooltip-arrow"></div></div>');
      plugin.box.append(plugin.tooltip);
      plugin.ul      = $('<ul></ul>');
      plugin.tooltip.hide();

      plugin.blocker.click(function(e) {
        plugin.kill();
        plugin.input.focus();
        e.stopPropagation();
      });
    
      $element.keyup(function(e) {
                
        plugin.pos = plugin.selection();        
                
        switch(e.keyCode) {
          case 13: // enter
            plugin.apply();
          case 27: // esc
            plugin.kill();
          case 38: // up
          case 40: // down
            return false;
          case 39: // right
            var value = plugin.value();
            if(value.length > 0 && plugin.pos == plugin.input.val().length) plugin.apply();
            break;
          case 188: // ,
            plugin.apply();
          default: 
            plugin.complete($(this).val());
            break;
        }

      });
      
      $element.keydown(function(e) {

        plugin.pos = plugin.selection();        

        switch(e.keyCode) {
          case 9:  // tab
            if(plugin.value().length > 0) {
              plugin.apply(); 
              return false;
            } else { 
              return true;
            }
            break;
          case 38: // up
            plugin.prev();
            return false;
          case 40: // down
            plugin.next();
            return false;
        }     
      });

      plugin.box.click(function(e) {
        e.stopPropagation();
      });
            
      $('body').append(plugin.box);
      $('body').append(plugin.blocker);
    
      $(window).resize(plugin.position);
      plugin.position();

    }
  
    plugin.load = function() {

      if(typeof url == 'object') {
        plugin.data = url;      
      } else {
        $.getJSON(url, function(result) {
          plugin.data = result;
        });
      }     

    }

    plugin.complete = function(search) {
    
      plugin.kill();
      plugin.position();

      var counter = 0;
      var search  = $.trim(search); 

      if(search.length == 0) return false;

      var reg = new RegExp('^' + search, 'i');

      var result = plugin.data.filter(function(str) {
        if(plugin.ignore.indexOf(str) == -1 && str.match(reg)) return str;
      });
      
      result = result.slice(0,5);
                                  
      $.each(result, function(i, string) {

        var highlightedString = '<span class="autocomplete-highlight">' +
          string.substring(0, search.length) +
          '</span>' + string.substring(search.length);

        var li = $('<li>' + highlightedString + '</li>');
        
        li.click(function() {
          plugin.apply(string)
        });
        
        li.mouseover(function() {
          plugin.ul.find('.selected').removeClass('selected');
          li.addClass('over');          
        });

        li.mouseout(function() {
          li.removeClass('over');
        });
        
        plugin.ul.append(li);

        if(counter==0) li.addClass('first selected');
        counter++;
                      
      });
      
      if(counter > 0) {
        plugin.tooltip.append(plugin.ul);        
        plugin.tooltip.show();
        plugin.blocker.show();
        plugin.open = true;
      }     
    }
        
    plugin.kill = function() {
      plugin.blocker.hide();
      plugin.ul.empty();
      plugin.tooltip.hide();
      plugin.open = false;
    }
    
    plugin.apply = function(string) {
      if(!string) {
        var string = plugin.value();
      } 
      plugin.settings.apply.call(plugin, string);
    }
    
    plugin.value = function() {
      return plugin.selected().text();
    }
    
    plugin.selected = function() {
      return plugin.ul.find('.selected');
    }
    
    plugin.select = function(element) {
      plugin.deselect();      
      element.addClass('selected');
    }
    
    plugin.deselect = function() {
      plugin.selected().removeClass('selected');
    }
    
    plugin.prev = function() {
      var sel  = plugin.selected();
      var prev = sel.prev();
      if(prev.length > 0) plugin.select(prev);
    }
    
    plugin.next = function() {
      var sel  = plugin.selected();   
      var next = (sel.length > 0) ? sel.next() : plugin.ul.find('li:first-child');
      if(next.length > 0) plugin.select(next);
    }

    plugin.selection = function() {
      var i = plugin.input[0];
      var v = plugin.val;
      if(!i.createTextRange) return i.selectionStart;
      var r = document.selection.createRange().duplicate();
      r.moveEnd('character', v.length);
      if(r.text == '') return v.length;
      return v.lastIndexOf(r.text);
    }

    plugin.position = function() {
      
      var pos    = $element.offset();
      var height = $element.innerHeight();

      pos.top = pos.top+height;
            
      plugin.box.css(pos);
          
    }
  
    plugin.init();
    
  }

  $.fn.autocomplete = function(url, options) {

    return this.each(function() {
      if(undefined == $(this).data('autocomplete')) {
        var plugin = new $.autocomplete(this, url, options);
        $(this).data('autocomplete', plugin);
      }
    });

  }

})(jQuery);


/** 
 * Tag input plugin
 * works great with the autocomplete plugin
 * 
 * @author Bastian Allgeier <bastian@getkirby.com>
 * @copyright Bastian Allgeier 2012
 * @license MIT
 */
(function($) {

  $.tagbox = function(element, options) {

    var defaults = {
      url          : false,
      autocomplete : {},
      lowercase    : true,
      classname    : 'tagbox',
      separator    : ', ',
      duplicates   : false,
      minLength    : 1,
      maxLength    : 140,
      keydown      : function() { },
      onAdd        : function() { },
      onRemove     : function() { },
      onDuplicate  : function() { return plugin.input.focus() },
      onInvalid    : function() { return plugin.input.focus() },
      onReady      : function() { }
    }

    var plugin = this;
    var autocomplete = null;

    plugin.settings = {}

    var $element = $(element),
         element = element;

    plugin.init = function() {
      plugin.settings = $.extend({}, defaults, options);

      var $name = $element.attr('name');
      var $id   = $element.attr('id');
      var $val  = $element.val();

      plugin.index   = [];
      plugin.val     = '';
      plugin.focused = false;
      plugin.origin  = $element.addClass('tagboxified').hide();
      plugin.box     = $('<div class="' + plugin.settings.classname + '"><ul><li class="new"><input autocomplete="off" tabindex="0" type="text" /></li></ul></div>');
      plugin.input   = plugin.box.find('input').css('width', 20);
      plugin.bhits   = 0;
      plugin.lhits   = 0;
            
      if(plugin.settings.url) {

        var autocompleteDefaults = {
          apply : function(string) {
            plugin.add(string); 
            this.kill();
            plugin.input.focus();
          }        
        };
        
        // initialize the autocomplete plugins with a default event
        plugin.input.autocomplete(plugin.settings.url, $.extend({}, autocompleteDefaults, plugin.settings.autocomplete));
        
        // store the autocomplete plugin object        
        plugin.autocomplete = plugin.input.data('autocomplete');
        
        // add autocomplete custom events to the tagbox plugin                
        plugin.settings.onAdd = function(tag) {
          plugin.autocomplete.ignore = plugin.serialize();
        }
        plugin.settings.onRemove = function(tag) {
          plugin.autocomplete.ignore = plugin.serialize();
        }
      
      }      

      plugin.origin.before(plugin.box);
    
      plugin.measure = $('<div style="display: inline" />').css({
        'font-size'   : plugin.input.css('font-size'),
        'font-family' : plugin.input.css('font-family'),
        'visibility'  : 'hidden',
        'position'    : 'absolute',
        'top'         : -10000,
        'left'        : -10000
      });

      $('body').append(plugin.measure);
                  
      plugin.box.click(function(e) {
        plugin.focus();
        plugin.input.focus();
        e.stopPropagation();
      });
      plugin.input.keydown(function(e) {
        plugin.val = plugin.input.val();
        plugin.position = plugin.selection();                                               
        plugin.settings.keydown.call(plugin, e, plugin.val);
      });
      plugin.input.keyup(function(e) {
        plugin.val = plugin.input.val();
        plugin.position = plugin.selection();                                               
        plugin.resize(plugin.val);
        if(plugin.val.match(new RegExp(plugin.settings.separator))) plugin.add(plugin.val);
      });
      plugin.input.focus(function(e) {
        plugin.input.focused = true;
        plugin.deselect();      
        plugin.bhits = 0;
        plugin.focus();
      });
      plugin.input.blur(function(e) {
        plugin.input.focused = false;
        plugin.bhits = 0;   
        if(plugin.val.length == 0) plugin.blur();               
      });       

      plugin.settings.onReady.call(this);

      $(document).keydown(function(e) {

        if(!plugin.focused) return true;

        switch(e.keyCode) {
          case 8: //backspace
            if(!plugin.input.focused) {
              plugin.remove();
              return false;
            }
            if(plugin.val.length == 0) {
              plugin.next();
              return false;           
            } else if(plugin.position == 0) {
              if(plugin.bhits > 0) {
                plugin.bhits = 0;
                plugin.next();
                return false;
              }
              plugin.bhits++;
            }
            break;      
          case 37: // left
            if(!plugin.input.focused) return plugin.previous();
            if(plugin.val.length == 0) {
              plugin.next();
              return false;           
            } else if(plugin.position == 0) {
              if(plugin.lhits > 0) {
                plugin.lhits = 0;
                plugin.next();
                return false;
              }
              plugin.lhits++;
            }
            break;
          case 39: // right
            if(!plugin.input.focused) {
              plugin.next();            
              return false;
            }
            break;
          case 9: // tab
            if(plugin.input.focused && plugin.val.length > plugin.settings.minLength) {
              plugin.add(plugin.val);
              return false;
            } else if(plugin.selected().length > 0) {
              plugin.deselect();
              plugin.input.focus();
              return false;
            }
            break;
          case 13: // enter
          case 188: // ,
            if(plugin.input.focused) {
              if(!plugin.settings.autocomplete) plugin.add(plugin.val);
              return false;
            }
            break;
        }
      
      }).click(function(e) {
        if(plugin.val.length > 0) plugin.add(plugin.val);
      });

      if($val.length > 0) plugin.add($val);

    }
            
    plugin.resize = function(value) {
      plugin.measure.text(value);
      plugin.input.css('width', plugin.measure.width() + 20);   
    },

    plugin.focus = function(input) {
      if(plugin.focused) return true;
      
      $('.tagboxified').not(plugin.origin).each(function() {
        if($(this).data('tagbox')) $(this).data('tagbox').blur();  
      });

      plugin.box.addClass('focus');
      plugin.focused = true;
      
      if(input == undefined) var input = true;
      if(input !== false) plugin.input.focus();
    }

    plugin.blur = function() {
      if(!plugin.focused) return true;
      plugin.box.removeClass('focus');
      plugin.focused = false;
      plugin.input.blur();    
      plugin.deselect();
    }
        
    plugin.tag = function(tag) {
      tag = tag.replace(/,/g,'').replace(/;/g,'');
      if(plugin.settings.lowercase) tag = tag.toLowerCase();
      return $.trim(tag);   
    }

    plugin.serialize = function() {
      return plugin.index;
    }

    plugin.string = function() {
      return plugin.serialize().toString();
    }

    plugin.add = function(tag) {

      plugin.input.val('');

      if(!tag && plugin.val.length > 0) {
        return plugin.add(plugin.val);
      } else if(!tag) {
        return true;
      }
            
      if($.isArray(tag) || tag.match(new RegExp(plugin.settings.separator))) {      
        var tags = ($.isArray(tag)) ? tag : tag.split(plugin.settings.separator);
        $.each(tags, function(i,t) {
          plugin.add(t);
        }); 
        return true;
      } 
        
      var tag = plugin.tag(tag);
          
      if(tag.length < plugin.settings.minLength || tag.length > plugin.settings.maxLength) {
        return plugin.settings.onInvalid.call(plugin, tag, length);
      }
      
      if(plugin.settings.duplicates == false) {
        if($.inArray(tag, plugin.index) > -1) {
          return plugin.settings.onDuplicate.call(plugin, tag);
        }
      }
      
      plugin.index.push(tag);
      
      var li = $('<li><span class="tag"></span><span class="delete">&#215;</span></li>').data('tag', tag);
      li.find('.tag').text(tag);
      li.find('.delete').click(function() { plugin.remove(li) });
                
      li.click(function(e) {
        plugin.blur();
        e.stopPropagation();          
        plugin.select(li);
      });
      li.focus(function(e) {
        plugin.select(li)
      });
    
      plugin.input.parent().before(li);
      plugin.input.val('');
      plugin.input.css('width', 20);

      var serialized = plugin.serialize();
      plugin.origin.val(serialized.join(plugin.settings.separator));
      plugin.settings.onAdd.call(plugin, tag, serialized, li);
                      
    }

    plugin.select = function(element) {

      if(typeof element == 'string') {
        var element = plugin.find(element);
        if(!element) return false;
      }

      if(element.length == 0) return false;     
      plugin.input.blur();
      this.deselect();
      element.addClass('selected');
      plugin.focus(false);
    }
      
    plugin.selected = function() {
      return plugin.box.find('.selected');  
    }

    plugin.deselect = function() {
      var selected = plugin.selected();
      selected.removeClass('selected'); 
    }

    plugin.find = function(tag) {
      var element = false;
      plugin.box.find('li').not('.new').each(function() {
        if($(this).data('tag') == tag) element = $(this);
      });     
      return element;
    }

    plugin.remove = function(element) {
      
      plugin.input.val('');
      
      if(typeof element == 'string') {
        var element = plugin.find(element);
        if(!element) return false;
      }
      
      var selected = plugin.selected();
      if(!element && selected.length > 0) var element = selected.first();
      var previous = plugin.previous(true);
      (previous.length == 0) ? plugin.next() : plugin.select(previous);
      var tag = element.find('.tag').text();
      plugin.removeFromIndex(tag);
      element.remove();
      var serialized = plugin.serialize();
      plugin.origin.val(serialized);
      plugin.settings.onRemove.call(plugin, tag, serialized, element);
    }

    plugin.removeFromIndex = function(tag) {
      var i = plugin.index.indexOf(tag);
      plugin.index.splice(i,1);
    }
    
    plugin.selection = function() {
      var i = plugin.input[0];
      var v = plugin.val;
      if(!i.createTextRange) return i.selectionStart;
      var r = document.selection.createRange().duplicate();
      r.moveEnd('character', v.length);
      if(r.text == '') return v.length;
      return v.lastIndexOf(r.text);
    }
    
    plugin.previous = function(ret) {
      var sel  = plugin.selected();
      var prev = (sel.length == 0) ? plugin.box.find('li').not('.new').first() : sel.prev().not('.new');
      return (ret) ? prev : plugin.select(prev);
    }
    
    plugin.next = function(ret) {
      var sel  = plugin.selected();
      var next = (sel.length == 0) ? plugin.box.find('li').not('.new').last() : sel.next();
      return (ret) ? next : (next.hasClass('new')) ? plugin.input.focus() : plugin.select(next);
    }

    plugin.init();
    
  }

  $.fn.tagbox = function(options) {

    return this.each(function() {
      if(undefined == $(this).data('tagbox')) {

        var plugin = new $.tagbox(this, options);
        $(this).data('tagbox', plugin);
        
      }
    });

  }

})(jQuery);

define("tags", function(){});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/backbone-forms/tags',['cdn.lodash', 'libs/backbone-forms', 'tags'], function(_, Form, tags) {
    return Form.editors.Tags = (function(_super) {

      __extends(Tags, _super);

      function Tags() {
        return Tags.__super__.constructor.apply(this, arguments);
      }

      Tags.prototype.width = 210;

      Tags.prototype.tagName = 'input';

      Tags.prototype.initialize = function(options) {
        Tags.__super__.initialize.call(this, options);
        return this.tagboxValue = this.value || [];
      };

      Tags.prototype.render = function() {
        var _this = this;
        _.defer(function() {
          return _this.renderTagbox();
        });
        return this;
      };

      Tags.prototype.renderTagbox = function() {
        var onAdd, onRemove, _ref, _ref1, _ref2, _ref3, _ref4,
          _this = this;
        this.tagboxOptions = (_ref = this.schema.options) != null ? _ref : [];
        this.$el.tagbox({
          url: this.tagboxOptions,
          lowercase: (_ref1 = this.schema.lowercase) != null ? _ref1 : true,
          duplicates: (_ref2 = this.schema.duplicates) != null ? _ref2 : false,
          minLength: (_ref3 = this.schema.minLength) != null ? _ref3 : 1,
          maxLength: (_ref4 = this.schema.maxLength) != null ? _ref4 : 140
        });
        this.tagbox = this.$el.data('tagbox');
        onAdd = this.tagbox.settings.onAdd;
        this.tagbox.settings.onAdd = function() {
          onAdd();
          if (_this.updating) {
            return;
          }
          _this.onChange();
          return _this.updateTagboxOptions();
        };
        onRemove = this.tagbox.settings.onRemove;
        this.tagbox.settings.onRemove = function() {
          onRemove();
          if (_this.updating) {
            return;
          }
          return _this.onChange();
        };
        return this.updateTagbox();
      };

      Tags.prototype.getValue = function() {
        if (this.tagbox != null) {
          this.tagboxValue = this.tagbox.serialize().slice(0);
        }
        return this.tagboxValue || [];
      };

      Tags.prototype.setValue = function(value) {
        if (!_.isArray(value)) {
          return;
        }
        if (_.isEqual(value, this.tagboxValue)) {
          return;
        }
        this.tagboxValue = value;
        return this.updateTagbox();
      };

      Tags.prototype.updateTagbox = function() {
        var member, _i, _len, _ref;
        if (this.tagbox == null) {
          return;
        }
        this.updating = true;
        this.clearValue();
        _ref = this.tagboxValue;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          this.tagbox.add("" + member);
        }
        this.updating = false;
        return this.updateTagboxOptions();
      };

      Tags.prototype.clearValue = function() {
        var _ref, _results;
        _results = [];
        while (((_ref = this.tagbox.serialize()) != null ? _ref.length : void 0) > 0) {
          _results.push(this.tagbox.remove(0));
        }
        return _results;
      };

      Tags.prototype.onChange = function() {
        return this.trigger('change', this);
      };

      Tags.prototype.updateTagboxOptions = function() {
        var member, _i, _len, _ref, _results;
        if (!this.schema.updateAutoComplete) {
          return;
        }
        _ref = _.difference(this.tagbox.serialize(), this.tagboxOptions);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _results.push(this.tagboxOptions.push(member));
        }
        return _results;
      };

      return Tags;

    })(Form.editors.Base);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/property_sheet',['cdn.marionette', 'text!templates/property_sheet.html', 'libs/backbone-forms', 'libs/backbone-forms.bootstrap', 'views/backbone-forms/color', 'views/backbone-forms/range', 'views/backbone-forms/tags'], function(Marionette, template, Form) {
    var PropertySheetView;
    return PropertySheetView = (function(_super) {

      __extends(PropertySheetView, _super);

      function PropertySheetView() {
        return PropertySheetView.__super__.constructor.apply(this, arguments);
      }

      PropertySheetView.prototype.template = _.template(template);

      PropertySheetView.prototype.className = 'properties-dialog';

      PropertySheetView.prototype.events = {
        'change input[type=number]': 'onFormChange'
      };

      PropertySheetView.prototype.ui = {
        form: '.js-form',
        errorCount: '.js-error-count',
        errorCountPlural: '.js-error-count-plural',
        errorCountContainer: '.js-error-count-container'
      };

      PropertySheetView.prototype.initialize = function() {
        return this.listenTo(this.options.config, 'change', this.onConfigChange);
      };

      PropertySheetView.prototype.onConfigChange = function(model, options) {
        if (!options.propertySheetChanging) {
          return this.render();
        }
      };

      PropertySheetView.prototype.setErrorCount = function(count) {
        this.ui.errorCount.text(count);
        this.ui.errorCountPlural.toggle(count !== 1);
        return this.ui.errorCountContainer.toggle(count > 0);
      };

      PropertySheetView.prototype.onRender = function() {
        var errors;
        if (this.form != null) {
          this.stopListening(this.form);
        }
        this.form = new Form({
          data: this.options.config.toJSON(),
          schema: this.options.propertySheetSchema.sanitizedSchema()
        }).render();
        errors = this.form.validate();
        this.setErrorCount(_.size(errors));
        this.listenTo(this.form, 'change', this.onFormChange);
        return this.ui.form.html(this.form.el);
      };

      PropertySheetView.prototype.onFormChange = function() {
        this.form.validate();
        return this.options.config.save(this.form.getValue(), {
          propertySheetChanging: true
        });
      };

      return PropertySheetView;

    })(Marionette.ItemView);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define('models/property_sheet_schema',['cdn.lodash', 'cdn.backbone'], function(_, Backbone) {
    var PropertySheetSchema;
    return PropertySheetSchema = (function(_super) {

      __extends(PropertySheetSchema, _super);

      function PropertySheetSchema() {
        return PropertySheetSchema.__super__.constructor.apply(this, arguments);
      }

      PropertySheetSchema.prototype.whiteListedAttributes = {
        Text: [],
        Number: [],
        TextArea: [],
        Checkbox: [],
        Color: [],
        Select: ['options'],
        Radio: ['options'],
        Checkboxes: ['options'],
        Date: ['yearStart', 'yearEnd'],
        DateTime: ['yearStart', 'yearEnd', 'minsInterval'],
        Range: ['min', 'max', 'step'],
        Tags: ['options', 'lowercase', 'duplicates', 'minLength', 'maxLength', 'updateAutoComplete']
      };

      PropertySheetSchema.prototype.constantSchemaTop = function() {
        return {
          conceptTags: {
            type: 'Tags',
            updateAutoComplete: true
          }
        };
      };

      PropertySheetSchema.prototype.sanitizedSchema = function() {
        var attributes, name, sanitizedAttributes, schema, _ref;
        schema = this.constantSchemaTop();
        _ref = this.attributes;
        for (name in _ref) {
          attributes = _ref[name];
          if (schema[name] == null) {
            sanitizedAttributes = this.sanitizedAttributes(attributes);
            if (sanitizedAttributes != null) {
              schema[name] = sanitizedAttributes;
            }
          }
        }
        return schema;
      };

      PropertySheetSchema.prototype.sanitizedAttributes = function(attributes) {
        var whiteListedAttributes;
        if (typeof attributes === 'string') {
          return this.sanitizedAttributes({
            type: attributes
          });
        }
        if (typeof attributes !== 'object') {
          return null;
        }
        whiteListedAttributes = this.whiteListedAttributes[attributes.type];
        if (whiteListedAttributes == null) {
          return null;
        }
        return _.pick.apply(_, [attributes, 'type', 'title', 'validators'].concat(__slice.call(whiteListedAttributes)));
      };

      PropertySheetSchema.prototype.generateDefault = function(config) {
        var definition, name, value, _results;
        _results = [];
        for (name in config) {
          value = config[name];
          definition = this._defaultDefinitionForValue(value);
          if (definition != null) {
            _results.push(this.set(name, definition));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      PropertySheetSchema.prototype._defaultDefinitionForValue = function(value) {
        switch (typeof value) {
          case 'boolean':
            return 'Checkbox';
          case 'number':
            return 'Number';
          case 'string':
            if (/^\#[a-f0-9]{6}$/i.test(value)) {
              return 'Color';
            } else if (value.length > 20) {
              return 'TextArea';
            } else {
              return 'Text';
            }
            break;
          case 'object':
            if (_.isArray(value) && _.every(value, function(member) {
              var _ref;
              return (_ref = typeof member) === 'string' || _ref === 'number';
            })) {
              return {
                type: 'Tags',
                options: _.uniq(value),
                updateAutoComplete: true
              };
            } else {
              return null;
            }
            break;
          default:
            return null;
        }
      };

      return PropertySheetSchema;

    })(Backbone.Model);
  });

}).call(this);

define('text!templates/gadget_instance.html',[],function () { return '<ul class="toolbar">\n  <li class="drag js-draggable"></li>\n  <li class="edit js-edit"></li>\n  <li class="properties js-properties"></li>\n  <li class="delete js-delete"></li>\n</ul>\n<div class="gadgetContent"></div>\n<div class="js-property-dialog"></div>\n';});

define('text!templates/gadget_instance_error.html',[],function () { return '<div class=\'alert alert-error\'>\n  <strong>Error!</strong> <%= errorDescription %>\n  <div class="error-controls">\n    <button class="btn js-hide">OK</button>\n    <button class="btn btn-danger js-delete">Delete it</button>\n  </div>\n</div>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  define('views/gadget_instance',['cdn.marionette', 'app/mediator', 'messages/facade', 'views/property_sheet', 'models/property_sheet_schema', 'text!templates/gadget_instance.html', 'text!templates/gadget_instance_error.html'], function(Marionette, mediator, Facade, PropertySheetView, PropertySheetSchema, template, error_template) {
    var GadgetInstanceView;
    return GadgetInstanceView = (function(_super) {

      __extends(GadgetInstanceView, _super);

      function GadgetInstanceView() {
        this.onFetchSuccess = __bind(this.onFetchSuccess, this);

        this.onFetchError = __bind(this.onFetchError, this);
        return GadgetInstanceView.__super__.constructor.apply(this, arguments);
      }

      GadgetInstanceView.prototype.template = _.template(template);

      GadgetInstanceView.prototype.className = 'gadget';

      GadgetInstanceView.prototype.regions = {
        propertySheetRegion: '.js-property-dialog'
      };

      GadgetInstanceView.prototype.events = {
        'click .js-draggable': 'onDraggableClick',
        'click .js-edit': 'onEditClick',
        'click .js-properties': 'onPropertiesClick',
        'click .js-delete': 'onDeleteClick',
        'click .js-hide': 'onHideClick',
        'dblclick .gadgetContent': 'onDblClick'
      };

      GadgetInstanceView.prototype.ui = {
        toolbar: '.toolbar',
        gadgetContent: '.gadgetContent'
      };

      GadgetInstanceView.prototype.initialize = function() {
        var saveDebounced,
          _this = this;
        this.listenTo(this.model, 'resolve:success', this.onFetchSuccess, this);
        this.listenTo(this.model, 'resolve:error', this.onFetchError, this);
        this._facade = new Facade({
          gadgetId: this.model.cid
        });
        this._facade.on('doneEditing', this.onFacadeDoneEditing, this);
        saveDebounced = _.debounce(this.saveGadgetConfig, 200);
        this._facade.on('registerPropertySheet', this.onRegisterPropertySheet, this);
        this._facade.on('configChange', this.onFacadeChange, this);
        this._facade.on('save', saveDebounced, this);
        this.listenTo(this.model, 'change', this.onPropertiesChange);
        this._propertySheetSchema = new PropertySheetSchema;
        this.gadgetRendering = $.Deferred();
        return this.once('gadgetRendered', function() {
          return _this.gadgetRendering.resolve();
        });
      };

      GadgetInstanceView.prototype.onInstanceAvailable = function() {
        var key;
        if (this._loading) {
          this._loading.done();
        }
        key = 'gadget-' + this.model.gadgetProject.get('id');
        this.ui.gadgetContent.addClass(key);
        this.passEvent('domReady');
        this.passEvent('render');
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.onDeleteClick = function() {
        this.toggleEdit(false);
        return this.model.destroy();
      };

      GadgetInstanceView.prototype.onHideClick = function() {
        return this.$el.fadeOut(200);
      };

      GadgetInstanceView.prototype.onDraggableClick = function() {};

      GadgetInstanceView.prototype.onEditClick = function(e) {
        e.stopPropagation();
        return this.toggleEdit();
      };

      GadgetInstanceView.prototype.onDblClick = function(e) {
        if (!this.isEditable()) {
          return;
        }
        this.trigger('dblclick');
        if (!this._isEditing) {
          return this.onEditClick(e);
        }
      };

      GadgetInstanceView.prototype.isEditable = function() {
        return this.$el.parents('.course').hasClass('editable');
      };

      GadgetInstanceView.prototype.isChild = function() {
        return !!this.model.config.get('_hidden');
      };

      GadgetInstanceView.prototype.onPropertiesChange = function(model, options) {
        return this.passEvent('configChange', this.model.config.toJSON());
      };

      GadgetInstanceView.prototype.onPropertiesClick = function() {
        return this.togglePropertySheet();
      };

      GadgetInstanceView.prototype.onFacadeDoneEditing = function() {
        return this.toggleEdit(false);
      };

      GadgetInstanceView.prototype.onFetchError = function(err) {
        return this.showCouldNotLoad("Couldn't fetch gadget from server");
      };

      GadgetInstanceView.prototype.onFetchSuccess = function(klass, defaultConfig) {
        if (defaultConfig == null) {
          defaultConfig = {};
        }
        return this.instantiateGadget(klass, defaultConfig);
      };

      GadgetInstanceView.prototype.gadgetOptions = function() {
        var options;
        options = this._facade;
        options.player = this._facade;
        options.el = this.$('.gadgetContent')[0];
        options.propertySheetSchema = this._propertySheetSchema;
        options.config = this.model.config;
        options.userState = this.model.userState;
        options.model = this.model.config;
        options.facade = this._facade;
        options.properties = this.model.config;
        options.properties.propertySheetSchema = this._propertySheetSchema;
        options.$el = this.$('.gadgetContent');
        return options;
      };

      GadgetInstanceView.prototype.extendGadgetClass = function(klass) {
        var _this = this;
        return klass.prototype.assetUrl = function(file) {
          var fileLookup;
          fileLookup = _this.model.gadgetProject.get('files');
          console.log(fileLookup, file, fileLookup[file]);
          return fileLookup[file];
        };
      };

      GadgetInstanceView.prototype.instantiateGadget = function(klass, defaultConfig) {
        var gadget, options;
        this.extendGadgetClass(klass);
        this.model._gadgetKlass = klass;
        this.model.config.setDefaults(defaultConfig);
        this._propertySheetSchema.generateDefault(this.model.config.toJSON());
        try {
          options = this.gadgetOptions();
          gadget = new klass(options, options.config.toJSON(), options.$el);
          this.onInstanceAvailable();
          this.toggleEdit(false);
          if (this.model.startEditable) {
            this.toggleEdit(true);
            return this.model.startEditable = false;
          }
        } catch (e) {
          this.showCouldNotLoad("Couldn't initialize gadget");
          throw e;
        }
      };

      GadgetInstanceView.prototype.onRender = function() {
        if (this.model._gadgetKlass) {
          return this.instantiateGadget(this.model._gadgetKlass);
        } else {
          return this._loading = new vs.ui.Loading(this.$el);
        }
      };

      GadgetInstanceView.prototype.passEvent = function() {
        var args, event, _ref;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (this.model._gadgetKlass) {
          return (_ref = this._facade).trigger.apply(_ref, [event].concat(__slice.call(args)));
        }
      };

      GadgetInstanceView.prototype.showCouldNotLoad = function(errorDescription) {
        if (this._loading) {
          this._loading.done();
        }
        this.$el.html(_.template(error_template, {
          errorDescription: errorDescription
        }));
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.onRegisterPropertySheet = function(schema) {
        this._propertySheetSchema.clear({
          silent: true
        });
        return this._propertySheetSchema.set(schema);
      };

      GadgetInstanceView.prototype.showPropertySheet = function() {
        if (!this._propertySheetView) {
          this._propertySheetView = new PropertySheetView({
            model: this.model,
            config: this.model.config,
            propertySheetSchema: this._propertySheetSchema
          });
          this.propertySheetRegion.show(this._propertySheetView);
        }
        return this._propertySheetView.$el.hide().show('fast');
      };

      GadgetInstanceView.prototype.hidePropertySheet = function() {
        if (this._propertySheetView) {
          return this._propertySheetView.$el.hide();
        }
      };

      GadgetInstanceView.prototype.toggleEdit = function(force) {
        var bool;
        bool = _.isBoolean(force);
        if (bool && force === this._isEditing) {
          return;
        }
        this._isEditing = bool ? force : !this._isEditing;
        if (this._isEditing) {
          this.trigger('edit', this);
        } else {
          this.togglePropertySheet(false);
          this.trigger('doneEditing', this);
        }
        this.$el.toggleClass('editing', this._isEditing);
        this.passEvent('toggleEdit', this._isEditing);
        return this.trigger('gadgetRendered');
      };

      GadgetInstanceView.prototype.showHoverables = function(bool) {
        var elements;
        if (bool == null) {
          bool = true;
        }
        elements = this.ui.toolbar.add(this.ui.gadgetContent);
        if (bool) {
          return elements.removeClass('blocked');
        } else {
          return elements.addClass('blocked');
        }
      };

      GadgetInstanceView.prototype.togglePropertySheet = function(force) {
        var bool;
        bool = _.isBoolean(force);
        if (bool && force === this._configVisible) {
          return;
        }
        this._configVisible = bool ? force : !this._configVisible;
        if (this._configVisible) {
          this.toggleEdit(true);
          return this.showPropertySheet();
        } else {
          return this.hidePropertySheet();
        }
      };

      GadgetInstanceView.prototype.onFacadeChange = function(attributes) {
        return this.model.config.set(attributes);
      };

      GadgetInstanceView.prototype.saveGadgetConfig = function(attributes) {
        if (attributes == null) {
          attributes = {};
        }
        return this.model.config.save(attributes);
      };

      return GadgetInstanceView;

    })(Marionette.Layout);
  });

}).call(this);

define('text!templates/section.html',[],function () { return '<div class=\'section\'><%= value %></div>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/section',['cdn.marionette', 'text!templates/section.html'], function(Marionette, template) {
    var Section;
    return Section = (function(_super) {

      __extends(Section, _super);

      function Section() {
        return Section.__super__.constructor.apply(this, arguments);
      }

      Section.prototype.template = _.template(template);

      Section.prototype.className = 'section-outer';

      return Section;

    })(Marionette.CompositeView);
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('plugins/vs-sticky',['cdn.lodash', 'cdn.jquery'], function(_, $) {
    var VsSticky;
    return VsSticky = (function() {

      function VsSticky(els, offset, interval) {
        this.els = els;
        this.offset = offset != null ? offset : 0;
        this.interval = interval != null ? interval : 10;
        this.scroll = __bind(this.scroll, this);

        this.updateEls(this.els);
        $("<style>.vs-sticky-stuck{top:" + this.offset + "px;}</style>").appendTo('head');
        this.topEl = this.els.get(0);
        this.scroll();
      }

      VsSticky.prototype.setEls = function(els) {
        this.els = els;
        return this.topEl = this.els.get(0);
      };

      VsSticky.prototype.updateEls = function() {
        this.els.addClass('vs-sticky');
        this.teardown();
        this.els.each(function() {
          return $(this).data({
            start: $(this).offset().top,
            height: $(this).outerHeight()
          });
        });
        return this.scroll();
      };

      VsSticky.prototype.listen = function() {
        var _this = this;
        return $(window).on('scroll', function() {
          _.throttle(_this.scroll, _this.interval);
          return _.throttle(_this.updateEls(), 1000);
        });
      };

      VsSticky.prototype.stopListening = function() {
        return $(window).off('scroll');
      };

      VsSticky.prototype.teardown = function() {
        this.els.removeClass('vs-sticky-stuck');
        return this.els.removeAttr('style');
      };

      VsSticky.prototype.scroll = function() {
        var cutoff, distanceToNext, height, i, nextEl, start, wrapper;
        cutoff = $(window).scrollTop() + this.offset;
        this.teardown();
        height = $(this.topEl).data('height');
        start = $(this.topEl).data('start');
        if (start > cutoff) {
          if (this.topEl !== this.els.get(0)) {
            i = 1;
            while ($(this.els[i]).data("start") < cutoff) {
              i++;
            }
            this.topEl = this.els[i - 1];
            this.scroll();
            return;
          }
        }
        if ($(this.topEl).parent().hasClass('wrapper')) {
          $(this.topEl).unwrap();
        }
        if (start <= cutoff) {
          wrapper = $('<div>').addClass('wrapper');
          wrapper.height(height);
          wrapper.css({
            'margin-bottom': $(this.topEl).css('margin-bottom')
          });
          $(this.topEl).wrap(wrapper);
          $(this.topEl).addClass('vs-sticky-stuck');
          nextEl = this.els.get(1 + this.els.index(this.topEl));
          if (!nextEl) {
            return;
          }
          distanceToNext = $(nextEl).data('start') - cutoff;
          if (distanceToNext <= height) {
            $(this.topEl).css('top', (this.offset + distanceToNext - height) + 'px');
            if (distanceToNext < 1) {
              return this.topEl = nextEl;
            }
          }
        }
      };

      return VsSticky;

    })();
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/lesson',['cdn.marionette', 'app/mediator', 'views/gadget_instance', 'views/section', 'views/inline_catalogue', 'app/catalogue', 'plugins/vs-sticky', 'cdn.jqueryui'], function(Marionette, mediator, GadgetInstanceView, SectionView, InlineCatalogueView, gadgetCatalogue, VsSticky) {
    var Lesson;
    _.extend(vs.api.Gadget.prototype, {
      onResolveError: function(error) {
        console.error(error);
        return this.trigger('resolve:error', error);
      },
      onResolveSuccess: function(klass) {
        return this.trigger('resolve:success', klass, this.gadgetProject.get('defaultConfig'));
      },
      resolve: function(opts) {
        var key, klass;
        if (opts == null) {
          opts = {};
        }
        _.bindAll(this, 'onResolveSuccess', 'onResolveError');
        if (!this.gadgetProject) {
          return this.onResolveError("Gadget Project not found: " + (this.get('type')));
        }
        if (this.gadgetProject.css) {
          key = 'gadget-' + this.gadgetProject.get('id');
          mediator.trigger('style:register', {
            key: key,
            href: this.gadgetProject.css,
            files: this.gadgetProject.get('files')
          });
        }
        if (klass = this.gadgetProject.get('classDefinition')) {
          return this.onResolveSuccess(klass);
        } else {
          return require([this.gadgetProject.main], this.onResolveSuccess, this.onResolveError);
        }
      }
    });
    return Lesson = (function(_super) {

      __extends(Lesson, _super);

      function Lesson() {
        this.showChild = __bind(this.showChild, this);

        this.addChildGadget = __bind(this.addChildGadget, this);

        this.pickChild = __bind(this.pickChild, this);

        this.onSortStop = __bind(this.onSortStop, this);

        this.onSortStart = __bind(this.onSortStart, this);

        this.onSortReceive = __bind(this.onSortReceive, this);

        this.onSortOver = __bind(this.onSortOver, this);
        return Lesson.__super__.constructor.apply(this, arguments);
      }

      Lesson.prototype.initialize = function(options) {
        var _this = this;
        if (options == null) {
          options = {};
        }
        this.collection = this.model.gadgets;
        this.catalogue = options.catalogue || gadgetCatalogue;
        this.on('itemview:edit', this.onItemViewEdit, this);
        this.on('itemview:doneEditing', this.onItemViewDoneEditing, this);
        this.listenTo(this.catalogue, 'ready', this.onCatalogueReady, this);
        $(window).click(function(e) {
          if ($('.gadget.editing').length && !$(e.target).parents('.gadget.editing, .modal').length) {
            return _this.children.each(function(child) {
              return child.toggleEdit(false);
            });
          }
        });
        $(window).on('resize', function() {
          return _this.fixSizing();
        });
        mediator.on('gadget:pickChild', this.pickChild);
        return mediator.on('gadget:showChild', this.showChild);
      };

      Lesson.prototype.className = 'gadgets';

      Lesson.prototype.getItemView = function(item) {
        if (item && item.get('type') === 'header/1') {
          return SectionView;
        } else {
          return GadgetInstanceView;
        }
      };

      Lesson.prototype.insertGadgetTypeAt = function(type, index) {
        var instance;
        if (instance = this.catalogue.buildInstanceOfType(type)) {
          instance.startEditable = true;
          this.collection.create(instance, {
            at: index
          });
          instance.resolve();
          this.fixSizing();
          return instance;
        } else {
          return console.error('Failed grabbing gadget ' + type);
        }
      };

      Lesson.prototype.makeSortable = function() {
        return this.$el.sortable({
          handle: '.js-draggable',
          containment: 'parent',
          axis: 'y',
          forceHelperSize: true,
          forcePlaceholderSize: true,
          tolerance: 'pointer',
          over: this.onSortOver,
          receive: this.onSortReceive,
          start: this.onSortStart,
          stop: this.onSortStop,
          scrollSensitivity: 40
        });
      };

      Lesson.prototype.resolveGadgets = function() {
        var _this = this;
        return this.collection.each(function(instance) {
          var project;
          project = _this.catalogue.findGadgetByType(instance.get('type'));
          instance.gadgetProject = project;
          return instance.resolve();
        });
      };

      Lesson.prototype.onCatalogueReady = function() {
        return this.resolveGadgets();
      };

      Lesson.prototype.onItemViewEdit = function(activeView) {
        this.trigger('menuDeactivated', false);
        this.children.each(function(itemView) {
          if (itemView !== activeView) {
            return itemView.toggleEdit(false);
          }
        });
        return this.children.each(function(itemView) {
          if (itemView !== activeView) {
            return itemView.showHoverables(false);
          }
        });
      };

      Lesson.prototype.onItemViewDoneEditing = function(activeView) {
        this.trigger('menuDeactivated', true);
        return this.children.each(function(itemView) {
          return itemView.showHoverables();
        });
      };

      Lesson.prototype.onSortOver = function(e, ui) {
        return ui.placeholder.animate({
          height: ui.helper.height()
        });
      };

      Lesson.prototype.onSortReceive = function(e, ui) {
        this.insertGadgetTypeAt(ui.item.data('type'), ui.item.index());
        return false;
      };

      Lesson.prototype.onSortStart = function(e, ui) {
        ui.item.find('.fixed').removeClass('fixed');
        ui.item.data('originalPosition', ui.item.index());
        ui.placeholder.height(ui.item.height() - 16);
        return ui.item.find('.toolbar').addClass("dragging");
      };

      Lesson.prototype.onSortStop = function(e, ui) {
        var _this = this;
        return _.defer(function() {
          var newIndex, oldIndex, popped;
          oldIndex = ui.item.data('originalPosition');
          newIndex = ui.item.index();
          popped = _this.collection.at(oldIndex);
          _this.collection.move(popped, newIndex);
          ui.item.find('.toolbar').removeClass("dragging");
          return _this.stickHeaders();
        });
      };

      Lesson.prototype.onRender = function() {
        this.makeSortable();
        if (this.catalogue.isReady()) {
          this.resolveGadgets();
        }
        this.navBarHeight = $('.courseHeader').height();
        this.fixSizing();
        return this.removeOrphans();
      };

      Lesson.prototype.removeOrphans = function() {
        var childGadgets,
          _this = this;
        childGadgets = [];
        this.model.gadgets.each(function(gadget) {
          var children;
          if (children = gadget.config.get('_children')) {
            return childGadgets = childGadgets.concat(_.values(children));
          }
        });
        return this.model.gadgets.each(function(gadget) {
          if (!gadget) {
            return;
          }
          if (gadget.config.get('_hidden') && !_.contains(childGadgets, gadget.id)) {
            return gadget.destroy({
              queue: true
            });
          }
        });
      };

      Lesson.prototype.fixSizing = function() {
        var _this = this;
        return _.defer(function() {
          return _this.$el.css({
            "min-height": document.documentElement.clientHeight - 2 * _this.navBarHeight
          });
        });
      };

      Lesson.prototype.appendHtml = function(collectionView, itemView, index) {
        var children,
          _this = this;
        if (itemView.isChild()) {
          this.onGadgetRendered(itemView);
          return false;
        }
        children = this.$el.children();
        if (children.size() <= index) {
          this.$el.append(itemView.el);
        } else {
          children.eq(index).before(itemView.el);
        }
        this.makeSortable();
        this.fixSizing();
        return itemView.on('gadgetRendered', function() {
          return _this.onGadgetRendered(itemView);
        });
      };

      Lesson.prototype.onGadgetRendered = function(itemView) {
        var renderedAll;
        itemView.rendered = true;
        renderedAll = this.children.every(function(i) {
          return i.rendered;
        });
        if (renderedAll) {
          this.stickHeaders();
        }
        return mediator.trigger('gadget:rendered', itemView, renderedAll);
      };

      Lesson.prototype.stickHeaders = function() {
        var _this = this;
        return _.defer(function() {
          if (!_this.sticky) {
            _this.sticky = new VsSticky(_this.$('.gadget-section'), _this.navBarHeight);
            _this.sticky.listen();
          }
          _this.sticky.setEls(_this.$('.gadget-section'));
          return _this.sticky.updateEls();
        });
      };

      Lesson.prototype.showHoverables = function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.children.each(function(itemView) {
          return itemView.showHoverables(bool);
        });
      };

      Lesson.prototype.showGadget = function(gadgetIndex) {
        var gadget,
          _this = this;
        gadget = this.children.findByIndex(gadgetIndex - 1);
        return gadget.gadgetRendering.done(function() {
          return _.defer(function() {
            return window.scrollTo(0, gadget.$el.offset().top - _this.navBarHeight);
          });
        });
      };

      Lesson.prototype.pickChild = function(options, source) {
        var el, error, name, onCancelled, onShown, parent, success,
          _this = this;
        el = options.el, name = options.name, success = options.success, error = options.error;
        parent = this.collection.get(source.gadgetId);
        onShown = function(inlineCatalogue) {
          return inlineCatalogue.on('selectGadget', function(type) {
            return _this.addChildGadget(parent, type, options);
          });
        };
        onCancelled = function() {
          return typeof error === "function" ? error("Gadget selection canceled") : void 0;
        };
        return mediator.trigger('inlineCatalogue:show', el, onShown, onCancelled);
      };

      Lesson.prototype.addChildGadget = function(parent, type, _arg) {
        var el, gadget, name, success,
          _this = this;
        name = _arg.name, el = _arg.el, success = _arg.success;
        gadget = this.insertGadgetTypeAt(type, this.children.length);
        gadget.once('sync', function() {
          var facade, _children;
          gadget.config.save({
            _hidden: true
          });
          _children = parent.config.get('_children') || {};
          _children[name] = gadget.id;
          parent.config.save({
            _children: _children
          });
          facade = _this.children.findByModel(gadget)._facade;
          return typeof success === "function" ? success(facade) : void 0;
        });
        return this.renderElsewhere(gadget, el);
      };

      Lesson.prototype.showChild = function(_arg, source) {
        var el, error, facade, gadget, id, name, parent, success, _children;
        el = _arg.el, name = _arg.name, success = _arg.success, error = _arg.error;
        parent = this.collection.get(source.gadgetId);
        _children = parent.config.get('_children') || {};
        id = _children[name];
        if (!id) {
          return typeof error === "function" ? error("Child " + name + " not found") : void 0;
        }
        gadget = this.collection.get(id);
        if (!gadget) {
          return typeof error === "function" ? error("Gadget with ID " + id + " not found") : void 0;
        }
        this.renderElsewhere(gadget, el);
        facade = this.children.findByModel(gadget)._facade;
        return typeof success === "function" ? success(facade) : void 0;
      };

      Lesson.prototype.renderElsewhere = function(gadget, destination) {
        var view;
        view = this.children.findByModel(gadget);
        view.$el.remove();
        view.$el = destination;
        return view.render();
      };

      return Lesson;

    })(Marionette.CollectionView);
  });

}).call(this);

define('text!views/../../toc/./student.html',[],function () { return '<ul class="table-of-contents student">\n  <% _.each(lessons, function(lesson) { %>\n    <li data-cid="<%= lesson.cid %>" class="js-navigate-lesson <%= !lesson.isAccessible ? \'disabled-lesson\' : \'\' %>">\n      <span title="<%= lesson.title %>"><%= lesson.title %></span>\n    </li>\n  <%})%>\n</ul>\n';});

define('text!views/../../toc/./author.html',[],function () { return '<ul class="table-of-contents">\n  <% _.each(lessons, function(lesson) { %>\n    <li data-cid="<%= lesson.cid %>" class="js-navigate-lesson <%= !lesson.isAccessible ? \'disabled-lesson\' : \'\' %>">\n      <i class="js-handle handle" />\n      <input class="js-rename-lesson" value="<%= lesson.title %>" readonly="readonly" />\n      <i class="lesson-fade"></i>\n      <i class="js-destroy-lesson delete-icon"></i>\n    </li>\n  <%})%>\n</ul>\n<ul>\n<li class="js-create-lesson create-lesson">Add lesson</li>\n</ul>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/../../toc/main',["cdn.jquery", "cdn.marionette", "text!./student.html", "text!./author.html", "cdn.jqueryui", "app/mediator"], function($, Marionette, studentTemplate, authorTemplate, juqeryUI, mediator) {
    var TableOfContentsView, delay;
    delay = function(ms, func) {
      return setTimeout(func, ms);
    };
    return TableOfContentsView = (function(_super) {

      __extends(TableOfContentsView, _super);

      function TableOfContentsView() {
        this.destroyLesson = __bind(this.destroyLesson, this);

        this.createLesson = __bind(this.createLesson, this);

        this.moveLesson = __bind(this.moveLesson, this);

        this.renameLesson = __bind(this.renameLesson, this);

        this.selectLesson = __bind(this.selectLesson, this);
        return TableOfContentsView.__super__.constructor.apply(this, arguments);
      }

      TableOfContentsView.prototype.template = function() {
        if (this.model.get('isEditable')) {
          return _.template(authorTemplate);
        } else {
          return _.template(studentTemplate);
        }
      };

      TableOfContentsView.prototype.events = {
        'click .js-create-lesson': 'createLesson',
        'click .js-destroy-lesson': 'destroyLesson',
        'dblclick .js-rename-lesson': 'enableLesson',
        'click .js-navigate-lesson': 'selectLesson',
        'change .js-rename-lesson': 'renameLesson',
        'blur .js-rename-lesson': 'disableLesson',
        'focus .js-rename-lesson': 'blurLesson'
      };

      TableOfContentsView.prototype.isEditable = function() {
        return this.model.get('isEditable');
      };

      TableOfContentsView.prototype.initialize = function(options) {
        var triggerHide,
          _this = this;
        this.model.lessons.on('change:title', this.render, this);
        this.model.lessons.on('add reset', this.render, this);
        this.model.lessons.on('remove', this.lessonRemoved, this);
        triggerHide = function() {
          return mediator.trigger('toc:hide');
        };
        mediator.on('toc:toggle', function() {
          var $toc;
          $toc = _this.$el.parent();
          if ($toc.is(':visible')) {
            return mediator.trigger('toc:hide');
          } else {
            return mediator.trigger('toc:show');
          }
        });
        mediator.on('toc:show', function() {
          return _this.$el.parent().stop().fadeIn('fast', function() {
            $(window).one('mousedown', triggerHide);
            return $(this).on('mousedown', function(e) {
              return e.stopPropagation();
            });
          });
        });
        mediator.on('toc:hide', function() {
          return _this.$el.parent().stop().fadeOut('fast', function() {
            return $(window).off('click', triggerHide);
          });
        });
        return mediator.on('blocking:changed', function() {
          return _this.model.fetch({
            success: _this.render
          });
        });
      };

      TableOfContentsView.prototype.render = function() {
        this.$el.html(this.template().call(this, this.serializeData()));
        return this.$el.find('ul:first').sortable({
          handle: '.handle',
          axis: 'y',
          containment: 'parent',
          tolerance: 'pointer'
        }).on('sortupdate', this.moveLesson);
      };

      TableOfContentsView.prototype.serializeData = function() {
        var lessons;
        lessons = this.model.lessons.map(function(lesson) {
          return _.extend(lesson.toJSON(), {
            cid: lesson.cid
          });
        });
        return _.extend(this.model.toJSON(), {
          lessons: lessons
        });
      };

      TableOfContentsView.prototype.selectLesson = function(e) {
        var lesson, target,
          _this = this;
        target = $(e.currentTarget);
        lesson = this.model.lessons.get(target.data('cid'));
        if (!this.isEditable() && lesson.get('isAccessible') === false) {
          return;
        }
        target.addClass('animated');
        target.addClass('flash');
        mediator.trigger('lesson:navigate', this.model.lessons.indexOf(lesson) + 1);
        return delay(200, function() {
          target.removeClass('animated');
          target.removeClass('flash');
          return mediator.trigger('toc:hide');
        });
      };

      TableOfContentsView.prototype.disableLesson = function(e) {
        return e.currentTarget.setAttribute('readonly', 'readonly');
      };

      TableOfContentsView.prototype.enableLesson = function(e) {
        e.currentTarget.removeAttribute('readonly');
        e.currentTarget.focus();
        e.stopPropagation();
        return false;
      };

      TableOfContentsView.prototype.blurLesson = function(e) {
        if (e.currentTarget.getAttribute('readonly')) {
          return e.currentTarget.blur();
        }
      };

      TableOfContentsView.prototype.renameLesson = function(e) {
        var lesson;
        if (!this.isEditable()) {
          return;
        }
        if (!e.currentTarget.value) {
          return;
        }
        lesson = this.model.lessons.get($(e.currentTarget.parentNode).data('cid'));
        return lesson.save({
          title: e.currentTarget.value
        });
      };

      TableOfContentsView.prototype.moveLesson = function(e, ui) {
        var lesson;
        if (!this.isEditable()) {
          return;
        }
        lesson = this.model.lessons.get(ui.item.data('cid'));
        return this.model.lessons.move(lesson, ui.item.index());
      };

      TableOfContentsView.prototype.createLesson = function() {
        if (!this.isEditable()) {
          return;
        }
        return this.model.lessons.create({});
      };

      TableOfContentsView.prototype.destroyLesson = function(e) {
        var cid;
        e.stopPropagation();
        if (!this.isEditable()) {
          return false;
        }
        if (!confirm('Are you sure you wish to delete this lesson?')) {
          return false;
        }
        cid = $(e.currentTarget.parentNode).data('cid');
        return this.model.lessons.get(cid).destroy({
          success: function() {
            return $(e.currentTarget).parents('li:first').fadeOut('fast', function() {
              return $(this).remove();
            });
          },
          error: function(model, xhr) {
            return console.log('error deleting lesson');
          }
        });
      };

      return TableOfContentsView;

    })(Marionette.View);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('views/course',['cdn.marionette', 'text!templates/course.html', 'views/lesson', 'app/mediator', '../../toc/main'], function(Marionette, template, LessonView, mediator, TOCView) {
    var Course, LessonOverview, LessonOverviewItem;
    LessonOverviewItem = (function(_super) {

      __extends(LessonOverviewItem, _super);

      function LessonOverviewItem() {
        return LessonOverviewItem.__super__.constructor.apply(this, arguments);
      }

      LessonOverviewItem.prototype.tagName = 'li';

      LessonOverviewItem.prototype.template = _.template('<h1><%= title %></h1>');

      LessonOverviewItem.prototype.events = {
        'click': 'onSelected'
      };

      LessonOverviewItem.prototype.onSelected = function() {
        return this.model.trigger('select', this.model);
      };

      return LessonOverviewItem;

    })(Marionette.ItemView);
    LessonOverview = (function(_super) {

      __extends(LessonOverview, _super);

      function LessonOverview() {
        return LessonOverview.__super__.constructor.apply(this, arguments);
      }

      LessonOverview.prototype.template = _.template('<div class="content"><%= title %></div><ul class="lessons"></ul>');

      LessonOverview.prototype.itemView = LessonOverviewItem;

      LessonOverview.prototype.itemViewContainer = '.lessons';

      return LessonOverview;

    })(Marionette.CompositeView);
    return Course = (function(_super) {

      __extends(Course, _super);

      function Course() {
        this.onToggleTOC = __bind(this.onToggleTOC, this);
        return Course.__super__.constructor.apply(this, arguments);
      }

      Course.prototype.initialize = function() {
        var _this = this;
        this._lessonTitleBlurrable = true;
        this.listenTo(this.model, 'change', this.onCourseChanged, this);
        this.listenTo(this.model.lessons, 'add', this.onLessonsAdd, this);
        this.listenTo(this.model.lessons, 'remove', this.onLessonsRemove, this);
        this.listenTo(this.model.lessons, 'select', this.onLessonSelected, this);
        this.listenTo(this.model.lessons, 'change:title', function(model, title) {
          return _this.updateTitle();
        });
        this.ensureLesson();
        mediator.on('toc:show', function() {
          return _this.ui.tocIcon.addClass('active');
        });
        mediator.on('toc:hide', function() {
          return _this.ui.tocIcon.removeClass('active');
        });
        return mediator.on('blocking:changed', this.showCompletion, this);
      };

      Course.prototype.ui = {
        lessonTitle: '.lessonTitle',
        lessonTitleWrapper: '.lessonTitleWrapper',
        courseTitle: '.courseTitle',
        courseTitleWrapper: '.courseTitleWrapper',
        title: '.title',
        toggleOverview: '.js-overview',
        tocIcon: '.toc-icon',
        completion: '.completion'
      };

      Course.prototype.regions = {
        lessonRegion: '.lessons',
        toc: '.toc'
      };

      Course.prototype.events = {
        'click .js-overview': 'onToggleOverview',
        'click .js-toggle-toc': 'onToggleTOC',
        'click .lessonTitle': 'startEditingLessonTitle',
        'click .courseTitle': 'startEditingCourseTitle',
        'click .completion .js-complete': 'onCompleteClick'
      };

      Course.prototype.template = _.template(template);

      Course.prototype.itemView = LessonView;

      Course.prototype.itemViewContainer = '.lessons';

      Course.prototype.className = function() {
        if (this.model.get('isEditable')) {
          return "course editable";
        } else {
          return "course";
        }
      };

      Course.prototype.serializeData = function() {
        return _.extend(this.model.toJSON(), {
          firstLessonTitle: this.model.lessons.first().get('title')
        });
      };

      Course.prototype.ensureLesson = function() {
        if (this.model.lessons.length === 0) {
          return this.model.lessons.add({});
        }
      };

      Course.prototype.getLessonView = function(lesson) {
        return this.children.findByModel(lesson);
      };

      Course.prototype.activeLessonIndex = function() {
        return this.model.lessons.indexOf(this._activeLesson);
      };

      Course.prototype.activateLesson = function(lesson) {
        var _this = this;
        if (this.loadingLesson) {
          this.loadingLesson.abort();
        }
        this.renderingLesson = $.Deferred();
        if (this.model.lessons.indexOf(lesson) === -1 || lesson === this._activeLesson) {
          this.renderingLesson.resolve();
          return false;
        }
        this.toggleLoading(true);
        this.stopEditingCourseTitle();
        this.stopEditingLessonTitle();
        this.loadingLesson = lesson.fetch();
        return this.loadingLesson.done(function() {
          return _this.displayLesson(lesson);
        });
      };

      Course.prototype.toggleLoading = function(loading) {
        var _ref;
        if (loading) {
          return this._loading = new vs.ui.Loading(this.$el.find('.lessons'));
        } else {
          return (_ref = this._loading) != null ? _ref.done() : void 0;
        }
      };

      Course.prototype.displayLesson = function(lesson) {
        this.toggleLoading(false);
        this._activeLesson = lesson;
        this.model.progress.save({
          lessonIndex: this.activeLessonIndex() + 1
        });
        if (this._lessonView) {
          this._lessonView.off('menuDeactivated');
          this._lessonView.off('itemview:dblclick');
        }
        this._lessonView = new LessonView({
          model: this._activeLesson
        });
        this._lessonView.on('menuDeactivated', this.showHoverables, this);
        this._lessonView.on('itemview:dblclick', this.onInstanceClicked, this);
        this.lessonRegion.show(this._lessonView);
        if (this.renderingLesson) {
          this.renderingLesson.resolve();
        }
        mediator.trigger('lesson:rendered', this._lessonView);
        this.updateTitle();
        return window.scrollTo(0, 0);
      };

      Course.prototype.addNewLesson = function(atIndex) {
        var index;
        index = atIndex || this.activeLessonIndex() + 1;
        this.model.lessons.create({}, {
          at: index
        });
        return this.displayLesson(this.model.lessons.at(index));
      };

      Course.prototype.deleteLesson = function(atIndex) {
        var index;
        index = atIndex || this.activeLessonIndex();
        return this.model.lessons.destroy(this.model.lessons.at(this.activeLessonIndex()));
      };

      Course.prototype.startEditing = function(field) {
        field.toggleEdit(true);
        field.$el.parent().addClass('editing');
        return this._lessonView.showHoverables(false);
      };

      Course.prototype.startEditingCourseTitle = function() {
        this.startEditing(this._courseTitle);
        return this._isEditingCourse = true;
      };

      Course.prototype.startEditingLessonTitle = function() {
        this.startEditing(this._lessonTitle);
        return this._isEditingLesson = true;
      };

      Course.prototype.stopEditing = function(model, field) {
        model.save({
          title: field.getPretty()
        });
        field.toggleEdit(false);
        field.$el.parent().removeClass('editing');
        return this._lessonView.showHoverables(true);
      };

      Course.prototype.stopEditingCourseTitle = function() {
        if (!this._isEditingCourse) {
          return;
        }
        this.stopEditing(this.model, this._courseTitle);
        return this._isEditingCourse = false;
      };

      Course.prototype.stopEditingLessonTitle = function() {
        if (!this._isEditingLesson) {
          return;
        }
        this.stopEditing(this._activeLesson, this._lessonTitle);
        return this._isEditingLesson = false;
      };

      Course.prototype.onCourseChanged = function() {
        return this.updateTitle();
      };

      Course.prototype.onInstanceClicked = function() {
        this.stopEditingLessonTitle();
        return this.stopEditingCourseTitle();
      };

      Course.prototype.onLessonsRemove = function(lesson, collection, options) {
        var index;
        if (collection.length === 0) {
          this.addNewLesson(0);
          this.displayLesson(this.model.lessons.at(0));
        }
        if (lesson === this._activeLesson) {
          index = Math.min(options.index, collection.length - 1);
          return this.activateLesson(this.model.lessons.at(index));
        }
      };

      Course.prototype.onLessonSelected = function(lesson) {
        return this.activateLesson(lesson);
      };

      Course.prototype.onLessonsChange = function() {
        return this.updateTitle();
      };

      Course.prototype.onRender = function() {
        var _this = this;
        this._rendered = true;
        this._lessonTitle = new vs.ui.EditableText({
          el: this.ui.lessonTitle,
          type: 'input',
          complete: function() {
            return _this.stopEditingLessonTitle();
          }
        });
        this._courseTitle = new vs.ui.EditableText({
          el: this.ui.courseTitle,
          type: 'input',
          complete: function() {
            return _this.stopEditingCourseTitle();
          }
        });
        this.activateLesson(this._activeLesson || this.model.lessons.first());
        this.toc.show(new TOCView({
          model: this.model
        }));
        return this.toc.ready = true;
      };

      Course.prototype.onToggleOverview = function() {
        this._activeView = new LessonOverview({
          model: this.model,
          collection: this.model.lessons
        });
        return this.lessonRegion.show(this._activeView);
      };

      Course.prototype.onToggleTOC = function() {
        return mediator.trigger('toc:toggle');
      };

      Course.prototype.updateTitle = function() {
        if (!this._rendered) {
          return;
        }
        return this.ui.lessonTitle.text(this._activeLesson.get('title'));
      };

      Course.prototype.showLesson = function(lessonIndex) {
        var lesson;
        lesson = this.model.lessons.at(lessonIndex - 1);
        return this.activateLesson(lesson);
      };

      Course.prototype.showGadget = function(lessonIndex, gadgetIndex) {
        var _this = this;
        this.showLesson(lessonIndex);
        return this.renderingLesson.done(function() {
          return _this._lessonView.showGadget(gadgetIndex);
        });
      };

      Course.prototype.showCompletion = function() {
        var complete;
        complete = this.model.lessons.every(function(i) {
          return i.get('isAccessible');
        });
        if (complete) {
          return this.ui.completion.fadeIn(200);
        }
      };

      Course.prototype.onCompleteClick = function() {
        return window.top.postMessage(JSON.stringify({
          event: 'courseEnd'
        }), '*');
      };

      return Course;

    })(Marionette.Layout);
  });

}).call(this);

define('text!templates/author_sidebar/author_sidebar.html',[],function () { return '<div class="section topleft">\n  <div class="js-header sidebarHeader"></div>\n\n  <div class="lastSaved">Last saved <span class="timestamp">seconds</span> ago</div>\n</div>\n<div class=\'header-drag-container\'><!-- Container for the Sortable list -->\n  <div data-type="gadget/section" class="addSection js-section">Drag to add new section</div>\n</div>\n\n<div class="js-catalogue catalogue"></div>\n';});

define('text!templates/publish_confirmation.html',[],function () { return '<div class="modal">\n  <div class="modal-header">\n    <button type="button" data-dismiss="modal" class="close">&times;</button>\n    <h3>Publish</h3>\n  </div>\n  <div class="modal-body">Your course has been published to Versal Labs!</div>\n  <div class="modal-footer">\n    <button data-dismiss="modal" class="btn">OK</button>\n  </div>\n</div>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/publish_confirmation',['cdn.marionette', 'text!templates/publish_confirmation.html'], function(Marionette, template) {
    var PublishConfirmation;
    return PublishConfirmation = (function(_super) {

      __extends(PublishConfirmation, _super);

      function PublishConfirmation() {
        return PublishConfirmation.__super__.constructor.apply(this, arguments);
      }

      PublishConfirmation.prototype.initialize = function(callback) {
        this.callback = callback;
      };

      PublishConfirmation.prototype.template = _.template(template);

      PublishConfirmation.prototype.events = {
        'click button': 'callback'
      };

      return PublishConfirmation;

    })(Marionette.ItemView);
  });

}).call(this);

define('text!templates/author_sidebar/header.html',[],function () { return '<ul class="icons">\n  <li class="settings-btn"><i class="icon_settings_large"></i></div>\n  <!--\n  <li class="settings-btn"><i class="icon_settings"></i></li>\n  <li class="gap"></li>\n  <li class="publish-btn"><i class="icon_publish"></i></li>\n  <li class="gap"></li>\n  <li class="iphone-preview-btn"><i class="icon_phone"></i></li>\n  <li class="ipad-preview-btn"><i class="icon_tablet"></i></li>\n  <li class="gap"></li>\n  <li class="undo-btn"><i class="icon_undo"></i></li>\n  <li class="redo-btn"><i class="icon_redo"></i></li>\n  -->\n</ul>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/author_sidebar/header',['cdn.marionette', 'views/publish_confirmation', 'text!templates/author_sidebar/header.html'], function(Marionette, PublishConfirmationView, template) {
    var AuthorSidebarHeader;
    return AuthorSidebarHeader = (function(_super) {

      __extends(AuthorSidebarHeader, _super);

      function AuthorSidebarHeader() {
        return AuthorSidebarHeader.__super__.constructor.apply(this, arguments);
      }

      AuthorSidebarHeader.prototype.template = _.template(template);

      AuthorSidebarHeader.prototype.events = {
        'click .undo-btn': 'undo',
        'click .redo-btn': 'redo',
        'click .publish-btn': 'publish',
        'click .iphone-preview-btn': 'previewIphone',
        'click .ipad-preview-btn': 'previewIpad',
        'click .settings-btn': 'settings'
      };

      AuthorSidebarHeader.prototype.publish = function() {};

      AuthorSidebarHeader.prototype.undo = function() {};

      AuthorSidebarHeader.prototype.redo = function() {};

      AuthorSidebarHeader.prototype.previewIphone = function() {};

      AuthorSidebarHeader.prototype.previewIpad = function() {};

      AuthorSidebarHeader.prototype.settings = function() {
        var callback, confirmView,
          _this = this;
        callback = function() {
          return Player.layout.dialogs.close();
        };
        confirmView = new PublishConfirmationView(callback);
        return Player.layout.dialogs.show(confirmView);
      };

      return AuthorSidebarHeader;

    })(Marionette.ItemView);
  });

}).call(this);

define('text!templates/author_sidebar/catalogue.html',[],function () { return '<div class="search-outer">\n  <input type="text" class="search" placeholder="Search gadgets" />\n</div>\n<div class="card-options">\n  <ul class="pull-left view-modes">\n    <li><i class="js-show-tile-view tile-view inactive"></i></li>\n    <li><i class="js-show-list-view list-view"></i></li>\n\n  </ul>\n  <!--\n  Removed per issue #415 until we finish up Marketplace\n  <div class="pull-right marketplace-link">\n    Gadget marketplace\n    <i class="tiny-arrow-icon"></i>\n  </div>\n  -->\n  <div class="clearfix"></div>\n</div>\n<div class="js-gadgets gadgetCards list-view">\n  <h3 class="header sandbox">Working Set:</h3>\n  <h3 class="header pending">Pending Approval:</h3>\n  <h3 class="header approved">Public:</h3>\n\n</div>\n';});

define('text!templates/author_sidebar/sidebar_gadget.html',[],function () { return '<div class="icon"></div>\n<div class="title"><%= title %></div>\n<div class="author">Versal Group</div>\n<div class="version"><%= version %></div>\n<div class="expansion">\n  <div class="title"><%= name %></div>\n  <div class="author">Versal Group</div>\n  <!-- Hide this until this functionality exists in API\n  <div class="stars"><span class="star"><i class="icon-star"></i></span><span class="star"><i class="icon-star"></i></span><span class="star"><i class="icon-star"></i></span><span class="star"><i class="icon-star"></i></span><span class="star"><i class="icon-star"></i></span>\n  </div><span class="dropdown">Free<i class="icon-caret-down"></i></span>\n  -->\n</div>\n<div class="clearfix"></div>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/author_sidebar/gadget',['cdn.marionette', 'text!templates/author_sidebar/sidebar_gadget.html'], function(Marionette, template) {
    var SidebarGadget;
    return SidebarGadget = (function(_super) {

      __extends(SidebarGadget, _super);

      function SidebarGadget() {
        return SidebarGadget.__super__.constructor.apply(this, arguments);
      }

      SidebarGadget.prototype.template = _.template(template);

      SidebarGadget.prototype.className = 'gadgetCard js-gadgetCard';

      SidebarGadget.prototype.events = {
        'click': 'onClick'
      };

      SidebarGadget.prototype.initialize = function() {
        this.$el.attr('data-type', this.model.get('type'));
        return this.model.set({
          title: this.model.get('title') || this.model.get('name')
        }, {
          silent: true
        });
      };

      SidebarGadget.prototype.ui = {
        icon: '.icon',
        title: '.title'
      };

      SidebarGadget.prototype.onRender = function() {
        if (this.model.has('icon')) {
          return this.ui.icon.css("background-image", "url(" + (this.model.get('icon')) + ")");
        }
      };

      SidebarGadget.prototype.onClick = function(e) {
        e.preventDefault();
        return this.toggleExpansion();
      };

      SidebarGadget.prototype.toggleExpansion = function(force) {
        this.$el.toggleClass('expanded', force);
        if (this.$el.hasClass('expanded')) {
          return this.trigger('expand', this);
        }
      };

      return SidebarGadget;

    })(Marionette.ItemView);
  });

}).call(this);

(function (_, Backbone) {

  var oldFilter = Backbone.Collection.prototype.filter,
      aliases = {},
      _exists = function (obj, key) { return obj.hasOwnProperty(key); },
      _slice = [].slice;

  Backbone.Filters = {};

  // Base class for describing Backbone Filters
  Backbone.Filter = (function () {

    function Filter (opts) {
      this.options = _.defaults(_.pick(opts, _.keys(this.defaults)), this.defaults);
    }

    _.extend(Filter.prototype, {
      defaults: {},
      options: {},
      run: function (collection, query) {
        this.query = query;
        return new collection.constructor(collection.models);
      }
    });

    // Provide aliasing (for the truly lazy)
    _.extend(Filter, {

      // Piggyback onto Backbone's `extend` method
      extend: Backbone.Collection.extend,

      define: function (alias, filter) {
          if (_exists(aliases, alias)) {
              throw('Filter alias ' + alias + ' is already defined');
          } else {
              aliases[alias] = filter;
          }
      },

      undefine: function (alias, filter) {
          if (_exists(aliases, alias)) {
              delete aliases[alias];
          } else {
              throw('Unknown filter alias ' + alias);
          }
      },

      lookup: function (alias) {
          if (_exists(aliases, alias)) {
              return aliases[alias];
          }

          return null;
      }
    });

    return Filter;

  })();

  // Add underscore methods
  _.each(['filter','first','invoke','last','reject','select','shuffle','sortBy','without'], function (key) {
    Backbone.Filters[key] = Backbone.Filter.extend({
      constructor: function () {
        this.args = _slice.call(arguments, 0);
      },
      run: function (collection) {
        var models = _[key].apply(_, [collection.models].concat(this.args));
        return new collection.constructor(models);
      }
    });
  });

  // Evaluates a single filter, a chained array of filters, or a 
  // string list of filter aliases
  var runFilters = function (collection, filter) {

    var args = _slice.call(arguments, 2),
        recurse = function (filter) {
          collection = runFilters.apply(this, [collection, filter].concat(args))
        };

    if (filter instanceof Backbone.Filter) {
      collection = filter.run(collection, args);
    }
    else {
      if (_.isString(filter)) {
        filter = _.map(filter.split('|'), Backbone.Filter.lookup)
      }
      _.each(filter, recurse);
    }

    return collection;
  };

  // Patch `Backbone.Collection.filter` method to support filters
  Backbone.Collection.prototype.filter = function (filter) {
    if (_.isFunction(filter)) {
      return oldFilter.apply(this, arguments);
    }
    else {
      return runFilters.apply(this, [this].concat(_slice.call(arguments)));
    }
  };

})(_, Backbone);

define("plugins/backbone.filter", ["cdn.backbone"], function(){});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/author_sidebar/catalogue',['cdn.marionette', 'text!templates/author_sidebar/catalogue.html', 'views/author_sidebar/gadget', 'app/catalogue', 'plugins/backbone.filter'], function(Marionette, template, GadgetCard, gadgetCatalogue) {
    var SidebarCatalogueView, includedInTypes;
    includedInTypes = Backbone.Filter.extend({
      defaults: {
        field: 'type',
        types: []
      },
      run: function(collection) {
        var _this = this;
        return collection.select(function(model) {
          return _this.options.types.indexOf(model.get(_this.options.field)) >= 0;
        });
      }
    });
    return SidebarCatalogueView = (function(_super) {

      __extends(SidebarCatalogueView, _super);

      function SidebarCatalogueView() {
        this.onSortStop = __bind(this.onSortStop, this);

        this.onSortReceive = __bind(this.onSortReceive, this);

        this.onSortStart = __bind(this.onSortStart, this);
        return SidebarCatalogueView.__super__.constructor.apply(this, arguments);
      }

      SidebarCatalogueView.prototype.className = 'gadget-catalogue js-gadget-catalogue';

      SidebarCatalogueView.prototype.template = _.template(template);

      SidebarCatalogueView.prototype.itemView = GadgetCard;

      SidebarCatalogueView.prototype.itemViewContainer = '.js-gadgets';

      SidebarCatalogueView.prototype.appendHtml = function(cv, iv) {
        if (iv.model.get('hidden')) {
          return;
        }
        if (iv.model.get('catalog') === 'approved') {
          return cv.$('.approved').after(iv.el);
        } else if (iv.model.get('catalog') === 'sandbox') {
          cv.$('h3.approved, h3.sandbox').show();
          return cv.$('.sandbox').after(iv.el);
        } else if (iv.model.get('catalog') === 'pending') {
          cv.$('h3.approved, h3.pending').show();
          return cv.$('.pending').after(iv.el);
        }
      };

      SidebarCatalogueView.prototype.ui = {
        gadgetList: '.js-gadgets'
      };

      SidebarCatalogueView.prototype.events = {
        'click .js-show-list-view': 'showListView',
        'click .js-show-tile-view': 'showTileView'
      };

      SidebarCatalogueView.prototype.initialize = function(opts) {
        var _this = this;
        if (opts == null) {
          opts = {};
        }
        this.catalogue = opts.catalogue || gadgetCatalogue;
        this.collection = new this.catalogue.constructor(this.catalogue.models);
        this.listenTo(this.catalogue, 'reset', function() {
          return _this.collection.reset(_this.catalogue.models);
        });
        return $(window).on('resize', function() {
          return _this.fixSizing();
        });
      };

      SidebarCatalogueView.prototype.onRender = function() {
        var _this = this;
        this.on('itemview:expand', this.onItemViewExpanded, this);
        this.ui.gadgetList.sortable({
          items: ".gadgetCard",
          connectWith: '.gadgets',
          delay: 100,
          placeholder: 'hidden atom-placeholder',
          cursorAt: {
            left: 10,
            top: 10
          },
          helper: 'clone',
          receive: this.onSortReceive,
          start: this.onSortStart,
          stop: this.onSortStop,
          over: (function() {
            return false;
          }),
          tolerance: 'pointer'
        });
        return _.defer(function() {
          return _this.fixSizing();
        });
      };

      SidebarCatalogueView.prototype.changeView = function(type) {
        var _this = this;
        this.$('.card-options i').addClass('inactive');
        this.$("." + type + "-view").removeClass('inactive');
        return this.ui.gadgetList.fadeOut(100, function() {
          return _this.ui.gadgetList.removeClass('list-view tile-view').addClass(type + '-view').fadeIn(100);
        });
      };

      SidebarCatalogueView.prototype.showListView = function() {
        return this.changeView('list');
      };

      SidebarCatalogueView.prototype.showTileView = function(e) {
        return this.changeView('tile');
      };

      SidebarCatalogueView.prototype.onItemViewExpanded = function(itemView) {
        return _.each(this.children.without(itemView), function(itemView) {
          return itemView.toggleExpansion(false);
        });
      };

      SidebarCatalogueView.prototype.onSortStart = function(e, ui) {
        ui.item.addClass('dragging');
        ui.item.removeClass('expanded').show();
        ui.helper.removeClass('expanded').show();
        ui.helper.addClass('atom');
        return ui.helper.css({
          width: 710,
          height: 'auto'
        }).hide().fadeIn(200);
      };

      SidebarCatalogueView.prototype.onSortReceive = function(e, ui) {
        return false;
      };

      SidebarCatalogueView.prototype.onSortStop = function(e, ui) {
        ui.item.removeClass('dragging');
        ui.item.removeAttr('style');
        return false;
      };

      SidebarCatalogueView.prototype.fixSizing = function() {
        return this.ui.gadgetList.height(document.documentElement.clientHeight - this.ui.gadgetList.position().top - 20);
      };

      return SidebarCatalogueView;

    })(Marionette.CompositeView);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/author_sidebar/author_sidebar',['cdn.marionette', 'text!templates/author_sidebar/author_sidebar.html', 'views/author_sidebar/header', 'views/author_sidebar/catalogue', 'views/author_sidebar/gadget', 'cdn.jqueryui'], function(Marionette, template, SidebarHeaderView, SidebarCatalogueView, SidebarGadgetView) {
    var AuthorSidebar;
    return AuthorSidebar = (function(_super) {

      __extends(AuthorSidebar, _super);

      function AuthorSidebar() {
        return AuthorSidebar.__super__.constructor.apply(this, arguments);
      }

      AuthorSidebar.prototype.template = _.template(template);

      AuthorSidebar.prototype.initialize = function() {
        var _this = this;
        this.listenTo(this.model, 'sync', this.onCourseSave);
        this.lastSavedTime = +(new Date());
        return setInterval(function() {
          return _this.updateSavedLabel();
        }, 10 * 1000);
      };

      AuthorSidebar.prototype.regions = {
        'header': '.js-header',
        'catalogue': '.js-catalogue'
      };

      AuthorSidebar.prototype.ui = {
        'section': '.js-section',
        'lastSavedTime': '.timestamp'
      };

      AuthorSidebar.prototype.onRender = function() {
        this.header.show(new SidebarHeaderView);
        this.catalogue.show(new SidebarCatalogueView);
        return this.ui.section.parent().sortable({
          connectWith: '.gadgets',
          delay: 100,
          placeholder: 'hidden atom-placeholder',
          helper: 'clone',
          stop: (function() {
            return false;
          }),
          start: function(e, ui) {
            return ui.item.show();
          }
        });
      };

      AuthorSidebar.prototype.onCourseSave = function() {
        this.lastSavedTime = +(new Date);
        return this.updateSavedLabel();
      };

      AuthorSidebar.prototype.updateSavedLabel = function() {
        var diff, label, max, min, unit, unitCount, _i, _len, _ref, _ref1;
        diff = (+(new Date)) - this.lastSavedTime;
        if (diff <= 30 * 1000) {
          label = "seconds";
        }
        if ((30 * 1000 < diff && diff <= 60 * 1000)) {
          label = "less than a minute";
        }
        _ref = [["minute", 60 * 1000, 60 * 60 * 1000], ["hour", 60 * 60 * 1000, 24 * 60 * 60 * 1000], ["day", 24 * 60 * 60 * 1000, Infinity]];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], unit = _ref1[0], min = _ref1[1], max = _ref1[2];
          if ((min < diff && diff <= max)) {
            unitCount = Math.floor(diff / min);
            label = "" + unitCount + " " + unit;
            if (unitCount > 1) {
              label += "s";
            }
          }
        }
        return this.ui.lastSavedTime.html(label);
      };

      return AuthorSidebar;

    })(Marionette.Layout);
  });

}).call(this);

define('text!templates/player.html',[],function () { return '<div class="player">\n  <div class="loadingCourse"></div>\n  <div class="authorSidebar"></div>\n  <div class="dialogs"></div>\n  <div class="container"></div>\n  <div class="scrubBar"></div>\n</div>\n';});

define('text!templates/loading.html',[],function () { return '<i class=\'icon-spinner icon-spin\'></i>\nLoading...\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('player',['cdn.marionette', 'views/course', 'views/author_sidebar/author_sidebar', 'app/catalogue', 'text!templates/player.html', 'text!templates/loading.html', 'app/mediator'], function(Marionette, CourseView, AuthorSidebarView, gadgetCatalogue, template, loadingTemplate, mediator) {
    var PlayerApplication, PlayerLayout, PlayerRouter;
    PlayerLayout = (function(_super) {

      __extends(PlayerLayout, _super);

      function PlayerLayout() {
        return PlayerLayout.__super__.constructor.apply(this, arguments);
      }

      PlayerLayout.prototype.template = template;

      PlayerLayout.prototype.regions = {
        authorSidebar: '.authorSidebar',
        dialogs: '.dialogs',
        courseContainer: '.container',
        position: '.scrubBar',
        loading: '.loadingCourse'
      };

      return PlayerLayout;

    })(Marionette.Layout);
    PlayerRouter = (function(_super) {

      __extends(PlayerRouter, _super);

      function PlayerRouter() {
        return PlayerRouter.__super__.constructor.apply(this, arguments);
      }

      PlayerRouter.prototype.initialize = function() {
        var router;
        mediator.on('lesson:navigate', this.navigateLesson, this);
        this.on('route:showLesson route:showGadget route:showCourse', this.updateId, this);
        router = this;
        return $(document).on('click', 'a.js-navigate', function() {
          router.navigate("courses/" + router.courseId + "/" + ($(this).attr('href')), {
            trigger: true
          });
          return false;
        });
      };

      PlayerRouter.prototype.routes = {
        'courses/:courseId': 'showCourse',
        'courses/:courseId/lessons/:lessonIndex': 'showLesson',
        'courses/:courseId/lessons/:lessonIndex/gadgets/:gadgetIndex': 'showGadget'
      };

      PlayerRouter.prototype.updateId = function(courseId) {
        this.courseId = courseId;
      };

      PlayerRouter.prototype.navigateLesson = function(lessonIndex) {
        return this.navigate("courses/" + this.courseId + "/lessons/" + lessonIndex, {
          trigger: true
        });
      };

      PlayerRouter.prototype.navigateGadget = function(lessonIndex, gadgetIndex) {
        return this.navigate("courses/" + this.courseId + "/lessons/" + lessonIndex + "/gadgets/" + gadgetIndex, {
          trigger: true
        });
      };

      return PlayerRouter;

    })(Backbone.Router);
    return PlayerApplication = (function() {

      PlayerApplication.prototype.defaults = {};

      function PlayerApplication(options) {
        this.onProgressLoad = __bind(this.onProgressLoad, this);

        this.onCourseLoad = __bind(this.onCourseLoad, this);

        var courseId, el,
          _this = this;
        if (!_.has(options, 'api')) {
          throw new Error('Please set options.api!');
        }
        vs.api.init(options.api);
        this.baseUrl = options && options.requireRoot ? options.requireRoot : '/';
        if (!this.baseUrl.match(/\/$/)) {
          this.baseUrl += '/';
        }
        require.config({
          baseUrl: this.baseUrl
        });
        mediator.on('player:style:register', this.registerStylesheet, this);
        this._courseRendering = $.Deferred();
        this._courseRendering.done(function() {
          return mediator.trigger('course:rendered', _this.courseView);
        });
        this.router = new PlayerRouter;
        this.options = _.extend({}, options, this.defaults);
        courseId = this.options.courseId;
        if (courseId) {
          this.router.courseId = courseId;
        }
        this.router.on('route:showLesson', this.showLesson, this);
        this.router.on('route:showGadget', this.showGadget, this);
        Backbone.history.start({
          root: window.location.pathname
        });
        if (this.options.container) {
          el = $(this.options.container).get(0);
        }
        this.layout = new PlayerLayout({
          el: el
        });
        this.layout.render();
        this._loading = new vs.ui.Loading(this.layout.$(this.layout.loading.el));
        this._loading.$el.html(loadingTemplate);
        gadgetCatalogue.fetchAll();
        if (this.router.courseId) {
          this.loadCourse(this.router.courseId);
        } else {
          this.buildCourse();
        }
      }

      PlayerApplication.prototype.registerStylesheet = function(url, errorCallback) {
        var img, link;
        url = this.baseUrl + url;
        link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', url);
        document.head.appendChild(link);
        if (errorCallback) {
          img = document.createElement('img');
          img.onerror = function() {
            return errorCallback();
          };
          return img.src = url;
        }
      };

      PlayerApplication.prototype.buildCourse = function() {
        var course;
        course = new vs.api.Course({
          lessons: [
            {
              title: 'lesson 1'
            }
          ]
        });
        return this.onCourseLoad(course);
      };

      PlayerApplication.prototype.loadCourse = function(courseId) {
        var courseModel, progressFetch,
          _this = this;
        courseModel = new vs.api.Course({
          id: courseId
        });
        courseModel.set({
          isEditable: false
        });
        progressFetch = courseModel.progress.fetch();
        progressFetch.success(this.onProgressLoad);
        courseModel.fetch({
          success: function(model) {
            return $.when(progressFetch).then(function() {
              return _this.onCourseLoad(model);
            });
          },
          silent: true
        });
        return this.course = courseModel;
      };

      PlayerApplication.prototype.handleException = function(e) {
        if (e instanceof vs.api.errors.ApplicationError) {
          return console.log('app error');
        } else if (e instanceof vs.api.errors.NotFound) {
          return console.log('not found');
        } else if (e instanceof vs.api.errors.PermissionDenied) {
          return console.log('permission denied');
        } else {
          return console.log('wtf');
        }
      };

      PlayerApplication.prototype.onCourseLoad = function(courseModel) {
        this._loading.done();
        if (this.options.noEditable || window.location.hash.indexOf('learn') !== -1) {
          courseModel.set({
            'isEditable': false
          });
        }
        this.courseView = new CourseView({
          model: courseModel
        });
        this.layout.courseContainer.show(this.courseView);
        this._courseRendering.resolve();
        if (courseModel.get('isEditable')) {
          this.layout.authorSidebar.show(new AuthorSidebarView({
            model: courseModel
          }));
        } else {
          this.layout.authorSidebar.ensureEl();
          this.layout.authorSidebar.$el.addClass('disabled');
        }
        return courseModel.parse = function(attrs) {
          attrs.lessons = _.map(attrs.lessons, function(lesson) {
            return _.omit(lesson, 'gadgets');
          });
          this.lessons.set(attrs.lessons);
          return _.omit(attrs, 'lessons');
        };
      };

      PlayerApplication.prototype.onProgressLoad = function(model) {
        if (model == null) {
          model = {};
        }
        if (model.lessonIndex) {
          if (model.gadgetIndex) {
            return this.router.navigateGadget(model.lessonIndex, model.gadgetIndex);
          } else {
            return this.router.navigateLesson(model.lessonIndex);
          }
        }
      };

      PlayerApplication.prototype.showLesson = function(courseId, lessonIndex) {
        var _this = this;
        return this._courseRendering.done(function() {
          return _this.courseView.showLesson(lessonIndex);
        });
      };

      PlayerApplication.prototype.showGadget = function(courseId, lessonIndex, gadgetIndex) {
        var _this = this;
        return this._courseRendering.done(function() {
          return _this.courseView.showGadget(lessonIndex, gadgetIndex);
        });
      };

      return PlayerApplication;

    })();
  });

}).call(this);

(function() {

  require(['player'], function(PlayerApplication) {
    if (window.onPlayerReady) {
      return window.onPlayerReady(PlayerApplication);
    }
  });

}).call(this);

define("launcher", function(){});
