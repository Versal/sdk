/*!
 * js-api v0.5.19
 * lovingly baked from 793f46c on 02. April 2014
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
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
define("../src/build/almond", function(){});

define('pagination',['require','exports','module','underscore'],function (require, exports, module) {(function() {
  var Pagination, _;

  _ = require('underscore');

  Pagination = (function() {
    var defaults, maxPerPage, pageParams, whitelist;

    maxPerPage = 20;

    defaults = {
      count: 0,
      page: 1,
      perPage: maxPerPage,
      pageCount: 1
    };

    pageParams = Pagination.pageParams = _.keys(defaults);

    whitelist = function(obj) {
      return _.pick(obj, pageParams);
    };

    function Pagination(params) {
      if (params == null) {
        params = {};
      }
      _.extend(this, defaults, whitelist(params));
    }

    Pagination.prototype.pageRequest = function(page, params) {
      var data;
      if (params == null) {
        params = {};
      }
      data = _.extend(whitelist(this), whitelist(params), {
        page: page
      });
      if (data.perPage < 1) {
        data.perPage = 1;
      } else if (data.perPage > maxPerPage) {
        data.perPage = maxPerPage;
      }
      if (!((0 < page && page <= data.pageCount))) {
        return false;
      }
      return _.pick(data, 'page', 'perPage');
    };

    return Pagination;

  })();

  module.exports = Pagination;

}).call(this);

});

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
    var indexes;
    if (options == null) {
      options = {};
    }
    indexes = this.getIndexes();
    if (!indexes.length) {
      return;
    }
    if (options.url == null) {
      options.url = _.result(this, 'url') + '/order';
    }
    if (options.attrs == null) {
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
        this.representations.set(attrs.representations);
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
      if (options.representations) {
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
        if (!attrs.contentType) {
          return 'contentType is required to upload an asset';
        }
      }
      if (!attrs.title) {
        return 'title is required';
      }
    };

    Asset.prototype._expandLocations = function(data) {
      var _this = this;
      if (!this.baseUrl) {
        return;
      }
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

define('models/course_revision',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, CourseRevision, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  CourseRevision = (function(_super) {
    __extends(CourseRevision, _super);

    function CourseRevision(attrs, options) {
      if (options == null) {
        options = {};
      }
      if (!(options.course || options.catalog)) {
        throw new Error('Course or catalog reference is mandatory for CourseRevision');
      }
      this.course = options.course;
      this.catalog = options.catalog;
      Backbone.Model.apply(this, arguments);
    }

    CourseRevision.prototype.toJSON = function() {
      var json, _ref;
      json = {
        courseId: ((_ref = this.course) != null ? _ref.id : void 0) || this.get('courseId')
      };
      json.revisionId = this.id || this.get('revisionId');
      return json;
    };

    return CourseRevision;

  })(Backbone.Model);

  module.exports = CourseRevision;

}).call(this);

});

define('collections/course_revisions',['require','exports','module','backbone','underscore','../models/course_revision'],function (require, exports, module) {(function() {
  var Backbone, CourseRevision, CourseRevisions, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  CourseRevision = require('../models/course_revision');

  CourseRevisions = (function(_super) {
    __extends(CourseRevisions, _super);

    CourseRevisions.prototype.model = CourseRevision;

    function CourseRevisions(models, options) {
      if (options == null) {
        options = {};
      }
      if (!(options.course || options.catalog)) {
        throw new Error('Course or catalog reference is mandatory for CourseRevisions');
      }
      this.course = options.course;
      this.catalog = options.catalog;
      Backbone.Collection.apply(this, arguments);
    }

    CourseRevisions.prototype.create = function(model, options) {
      if (options == null) {
        options = {};
      }
      if (this.course) {
        options.course = this.course;
      }
      if (this.catalog) {
        options.catalog = this.catalog;
      }
      return CourseRevisions.__super__.create.call(this, model, options);
    };

    return CourseRevisions;

  })(Backbone.Collection);

  module.exports = CourseRevisions;

}).call(this);

});

define('models/catalog',['require','exports','module','underscore','backbone','../collections/course_revisions'],function (require, exports, module) {(function() {
  var Backbone, Catalog, CourseRevisions, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Backbone = require('backbone');

  CourseRevisions = require('../collections/course_revisions');

  Catalog = (function(_super) {
    __extends(Catalog, _super);

    Catalog.prototype.urlRoot = '/catalogs';

    function Catalog(attrs, options) {
      var _this = this;
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.courses = new CourseRevisions(options.courses, {
        catalog: this
      });
      this.courses.url = function() {
        return _.result(_this, 'url') + '/courses';
      };
      options.parse = true;
      Backbone.Model.apply(this, arguments);
    }

    Catalog.prototype.parse = function(attrs) {
      if (attrs.courses) {
        return this.courses.set(attrs.courses);
      }
    };

    return Catalog;

  })(Backbone.Model);

  module.exports = Catalog;

}).call(this);

});

define('collections/catalogs',['require','exports','module','backbone','../models/catalog'],function (require, exports, module) {(function() {
  var Backbone, Catalog, Catalogs, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  Catalog = require('../models/catalog');

  Catalogs = (function(_super) {
    __extends(Catalogs, _super);

    function Catalogs() {
      _ref = Catalogs.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Catalogs.prototype.url = '/catalogs';

    Catalogs.prototype.model = Catalog;

    return Catalogs;

  })(Backbone.Collection);

  module.exports = Catalogs;

}).call(this);

});

define('models/course_head',['require','exports','module','./course_revision','underscore'],function (require, exports, module) {(function() {
  var CourseHead, CourseRevision, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CourseRevision = require('./course_revision');

  _ = require('underscore');

  CourseHead = (function(_super) {
    __extends(CourseHead, _super);

    function CourseHead() {
      _ref = CourseHead.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CourseHead.prototype.isNew = function() {
      return false;
    };

    CourseHead.prototype.discard = function(options) {
      this.id = null;
      return this.save(this, options);
    };

    return CourseHead;

  })(CourseRevision);

  module.exports = CourseHead;

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

    CourseProgress.prototype.isNew = function() {
      return false;
    };

    return CourseProgress;

  })(Backbone.Model);

  module.exports = CourseProgress;

}).call(this);

});

define('models/gadget_userstate',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, GadgetUserstate, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetUserstate = (function(_super) {
    __extends(GadgetUserstate, _super);

    function GadgetUserstate() {
      _ref = GadgetUserstate.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetUserstate.prototype.isNew = function() {
      return false;
    };

    GadgetUserstate.prototype.initialize = function(data, options) {
      if (!(options != null ? options.gadget : void 0)) {
        throw new Error('gadget should be provided to create a gadget state');
      }
      return this.gadget = options.gadget;
    };

    GadgetUserstate.prototype.setDefaults = function(vals) {
      return this.set(_.omit(vals, _.keys(this.attributes)));
    };

    return GadgetUserstate;

  })(Backbone.Model);

  module.exports = GadgetUserstate;

}).call(this);

});

define('collections/gadget_userstates',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetUserstates, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  GadgetUserstates = (function(_super) {
    __extends(GadgetUserstates, _super);

    function GadgetUserstates() {
      _ref = GadgetUserstates.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetUserstates.prototype.url = function() {
      if (this.gadget && this.gadget.collection) {
        return this.gadget.url() + '/userstates';
      }
    };

    GadgetUserstates.prototype.initialize = function(models, options) {
      if (!(options != null ? options.gadget : void 0)) {
        throw new Error('Gadget reference is mandatory for GadgetUserstates');
      }
      return this.gadget = options.gadget;
    };

    return GadgetUserstates;

  })(Backbone.Collection);

  module.exports = GadgetUserstates;

}).call(this);

});

define('models/gadget_config',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, GadgetConfig, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetConfig = (function(_super) {
    __extends(GadgetConfig, _super);

    function GadgetConfig() {
      _ref = GadgetConfig.__super__.constructor.apply(this, arguments);
      return _ref;
    }

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

    GadgetConfig.prototype.validate = function() {
      if (!this.gadget.id) {
        return 'Cannot save config before gadget has been given an ID';
      }
    };

    return GadgetConfig;

  })(Backbone.Model);

  module.exports = GadgetConfig;

}).call(this);

});

define('models/gadget',['require','exports','module','backbone','underscore','./gadget_userstate','../collections/gadget_userstates','./gadget_config'],function (require, exports, module) {(function() {
  var Backbone, Gadget, GadgetConfig, GadgetUserstate, GadgetUserstates, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  GadgetUserstate = require('./gadget_userstate');

  GadgetUserstates = require('../collections/gadget_userstates');

  GadgetConfig = require('./gadget_config');

  Gadget = (function(_super) {
    __extends(Gadget, _super);

    function Gadget(attrs, options) {
      var _this = this;
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.config = new GadgetConfig({}, {
        gadget: this
      });
      this.config.url = function() {
        return _.result(_this, 'url') + '/config';
      };
      this.userState = new GadgetUserstate({}, {
        gadget: this
      });
      this.userState.url = function() {
        return _.result(_this, 'url') + '/userstate';
      };
      this.userStates = new GadgetUserstates([], {
        gadget: this
      });
      options.parse = true;
      Gadget.__super__.constructor.call(this, attrs, options);
    }

    Gadget.prototype._locals = ['uploadPercent'];

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
      if (attrs.gadgetProject) {
        this.gadgetProject = attrs.gadgetProject;
      }
      return _.omit(attrs, ['config', 'userState', 'gadgetProject']);
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
      return _.omit(json, this._locals);
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

define('models/gadget_project',['require','exports','module','underscore','backbone','jquery','./gadget'],function (require, exports, module) {(function() {
  var $, Backbone, Gadget, GadgetProject, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Backbone = require('backbone');

  $ = require('jquery');

  Gadget = require('./gadget');

  module.exports = GadgetProject = (function(_super) {
    __extends(GadgetProject, _super);

    function GadgetProject() {
      _ref = GadgetProject.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetProject.prototype.urlRoot = '/gadgets';

    GadgetProject.prototype.url = function() {
      var base;
      base = _.result(this.collection, 'url') || this.urlRoot;
      return _.flatten(_.compact([base, this.typeSegments()])).join('/');
    };

    GadgetProject.prototype.path = function(file) {
      var base;
      base = this.urlRoot;
      if (GadgetProject.prototype.apiUrl) {
        base = GadgetProject.prototype.apiUrl.replace(/\/$/, '') + base;
      }
      return _.flatten(_.compact([base, this.typeSegments(), file])).join('/');
    };

    GadgetProject.prototype.manifest = function() {
      return this.path('manifest');
    };

    GadgetProject.prototype.main = function() {
      return this.path('gadget.js');
    };

    GadgetProject.prototype.css = function() {
      if (!this.has('noCss')) {
        return this.path('gadget.css');
      }
    };

    GadgetProject.prototype.icon = function() {
      return this.path('assets/icon.png');
    };

    GadgetProject.prototype.code = function() {
      return this.path('code.zip');
    };

    GadgetProject.prototype.compiled = function() {
      return this.path('compiled.zip');
    };

    GadgetProject.prototype.typeSegments = function() {
      var version;
      version = this.get('version') || 'latest';
      return [this.get('username'), this.get('name'), version];
    };

    GadgetProject.prototype.type = function() {
      var type;
      type = "" + (this.get('username')) + "/" + (this.get('name'));
      if (this.get('version')) {
        type += "@" + (this.get('version'));
      }
      return type;
    };

    GadgetProject.prototype.cssClassName = function() {
      return ("gadget-" + (this.typeSegments().join('-'))).replace(/[\.\s]+/g, '_');
    };

    GadgetProject.prototype.fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return GadgetProject.__super__.fetch.call(this, _.extend(opts, {
        url: this.manifest()
      }));
    };

    GadgetProject.prototype.isNew = function() {
      return false;
    };

    GadgetProject.prototype.toJSON = function(opts) {
      if (opts != null ? opts.include : void 0) {
        return _.pick.apply(this, this.attributes, opts.include);
      } else {
        return _.clone(this.attributes);
      }
    };

    GadgetProject.prototype.buildInstance = function(attrs) {
      var instance, options;
      options = {
        config: this.get('defaultConfig'),
        userState: this.get('defaultUserState'),
        type: this.type()
      };
      _.extend(options, attrs);
      return instance = new Gadget(options);
    };

    return GadgetProject;

  })(Backbone.Model);

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

    GadgetProjects.prototype.model = GadgetProject;

    GadgetProjects.prototype.url = function() {
      return '/gadgets';
    };

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

    GadgetProjects.prototype.fetchRejected = function(params) {
      return this.fetchFiltered({
        user: 'me',
        catalog: 'rejected'
      }, params);
    };

    GadgetProjects.prototype.findByType = function(type) {
      var filter, gadgetType, name, username, version, _ref1, _ref2;
      _ref1 = type.split('@'), gadgetType = _ref1[0], version = _ref1[1];
      _ref2 = gadgetType.split('/'), username = _ref2[0], name = _ref2[1];
      filter = {
        username: username,
        name: name
      };
      if (version) {
        filter.version = version;
      }
      return this.findWhere(filter);
    };

    return GadgetProjects;

  })(Backbone.Collection);

  module.exports = GadgetProjects;

}).call(this);

});

define('models/gadget_palette',['require','exports','module','underscore','backbone','../collections/gadget_projects'],function (require, exports, module) {(function() {
  var Backbone, GadgetPalette, GadgetProjects, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Backbone = require('backbone');

  GadgetProjects = require('../collections/gadget_projects');

  module.exports = GadgetPalette = (function(_super) {
    __extends(GadgetPalette, _super);

    function GadgetPalette() {
      _ref = GadgetPalette.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetPalette.prototype.initialize = function(models, options) {
      if (options == null) {
        options = {};
      }
      if (options != null ? options.course : void 0) {
        return this.url = function() {
          return _.result(options.course, 'url') + '/palette';
        };
      }
    };

    GadgetPalette.prototype.upgrade = function(type, opts) {
      return this.changeVersion(type, null, opts);
    };

    GadgetPalette.prototype.changeVersion = function(type, version, opts) {
      var gadgetProject, url;
      if (opts == null) {
        opts = {};
      }
      gadgetProject = this.findByType(type);
      if (!gadgetProject) {
        return $.Deferred().reject("Gadget project not found");
      }
      url = gadgetProject.url();
      opts.url || (opts.url = url);
      if (!version) {
        version = gadgetProject.get('latestVersion');
      }
      return gadgetProject.save({
        version: version
      }, opts);
    };

    return GadgetPalette;

  })(GadgetProjects);

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
        return _.result(this.lesson, 'url') + '/gadgets';
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
      title: 'Untitled lesson',
      isActive: false
    };

    Lesson.prototype._locals = ['isActive'];

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
      return _.omit(attrs, 'gadgets', this._locals);
    };

    Lesson.prototype.validate = function(attrs, options) {
      if (!attrs.title) {
        return 'Title must be not empty';
      }
    };

    Lesson.prototype.toJSON = function(options) {
      var result;
      result = _.clone(this.attributes);
      if (options != null ? options.gadgets : void 0) {
        result.gadgets = this.gadgets.toJSON();
      }
      return _.omit(result, this._locals);
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
        return _.result(this.course, 'url') + '/lessons';
      }
    };

    Lessons.prototype.initialize = function(models, options) {
      if (!(options != null ? options.course : void 0)) {
        throw new Error('Course reference is mandatory for the Lessons');
      }
      return this.course = options.course;
    };

    return Lessons;

  })(Backbone.Collection);

  module.exports = Lessons;

}).call(this);

});

define('models/user',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, User, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  User = (function(_super) {
    __extends(User, _super);

    User.prototype.urlRoot = '/users';

    function User(attrs, options) {
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.orgs = new Backbone.Collection;
      Backbone.Model.call(this, attrs, options);
    }

    User.prototype.parse = function(attrs) {
      if (attrs.orgs) {
        this.orgs.set(attrs.orgs, {
          parse: true
        });
      }
      return _.omit(attrs, 'orgs');
    };

    User.prototype.signin = function(options) {
      if (options == null) {
        options = {};
      }
      options.url = '/signin/' + this.id;
      options.useApiKey = true;
      return this.sync('create', this, options);
    };

    User.prototype.signout = function(options) {
      if (options == null) {
        options = {};
      }
      options.url = '/signout';
      return this.sync('create', this, options);
    };

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
        fn: 'Anonymous',
        location: '',
        shortDesc: '',
        longDesc: '',
        website: '',
        social: [],
        registered: false
      };
    };

    User.prototype.fetch = function(options) {
      if (options == null) {
        options = {};
      }
      if (options.self) {
        options.url = '/user';
      }
      return User.__super__.fetch.call(this, options);
    };

    User.prototype.toJSON = function() {
      return _.extend({}, this.attributes, {
        orgs: this.orgs.toJSON()
      });
    };

    return User;

  })(Backbone.Model);

  module.exports = User;

}).call(this);

});

define('models/user_role',['require','exports','module','backbone','underscore','../models/user'],function (require, exports, module) {(function() {
  var Backbone, User, UserRole, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  User = require('../models/user');

  UserRole = (function(_super) {
    __extends(UserRole, _super);

    UserRole.prototype.idAttribute = 'userId';

    UserRole.prototype.defaults = {
      roles: []
    };

    function UserRole(attrs, options) {
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.user = new User;
      options.parse = true;
      Backbone.Model.call(this, attrs, options);
    }

    UserRole.prototype.parse = function(resp, opts) {
      if (resp.user) {
        this.user.set(resp.user);
        resp.userId = this.user.id;
      }
      return _.omit(resp, 'user');
    };

    UserRole.prototype.toJSON = function(options) {
      var json;
      json = {
        roles: this.attributes.roles
      };
      if (this.get('userId')) {
        json.userId = this.get('userId');
      } else {
        json.user = this.user.toJSON();
      }
      return json;
    };

    UserRole.prototype.destroy = function(options) {
      this.set({
        roles: []
      });
      return this.sync('update', this, options);
    };

    return UserRole;

  })(Backbone.Model);

  module.exports = UserRole;

}).call(this);

});

define('collections/user_roles',['require','exports','module','backbone','../models/user_role'],function (require, exports, module) {(function() {
  var Backbone, UserRole, UserRoles, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  UserRole = require('../models/user_role');

  UserRoles = (function(_super) {
    __extends(UserRoles, _super);

    function UserRoles() {
      _ref = UserRoles.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    UserRoles.prototype.model = UserRole;

    return UserRoles;

  })(Backbone.Collection);

  module.exports = UserRoles;

}).call(this);

});

define('collections/users',['require','exports','module','../models/user','backbone'],function (require, exports, module) {(function() {
  var Backbone, User, Users, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  User = require('../models/user');

  Backbone = require('backbone');

  Users = (function(_super) {
    __extends(Users, _super);

    function Users() {
      _ref = Users.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Users.prototype.model = User;

    Users.prototype.url = function() {
      return '/users';
    };

    return Users;

  })(Backbone.Collection);

  module.exports = Users;

}).call(this);

});

define('models/course',['require','exports','module','backbone','underscore','./catalog','./course_head','./course_progress','../collections/course_revisions','../models/gadget_palette','../collections/lessons','../collections/user_roles','../collections/users'],function (require, exports, module) {(function() {
  var Backbone, Catalog, Course, CourseHead, CourseProgress, CourseRevisions, GadgetPalette, Lessons, UserRoles, Users, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Catalog = require('./catalog');

  CourseHead = require('./course_head');

  CourseProgress = require('./course_progress');

  CourseRevisions = require('../collections/course_revisions');

  GadgetPalette = require('../models/gadget_palette');

  Lessons = require('../collections/lessons');

  UserRoles = require('../collections/user_roles');

  Users = require('../collections/users');

  Course = (function(_super) {
    __extends(Course, _super);

    Course.prototype.urlRoot = '/courses';

    Course.prototype.defaults = {
      title: 'Untitled course',
      isEditable: false,
      shortDesc: '',
      longDesc: '',
      authorBio: '',
      tags: [],
      catalogs: []
    };

    function Course(attrs, options) {
      var _this = this;
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.authors = new Users;
      this.authors.url = function() {
        return _.result(_this, 'url') + '/users';
      };
      this.lessons = new Lessons([], {
        course: this
      });
      this.progress = new CourseProgress({}, {
        course: this
      });
      this.progress.url = function() {
        return _.result(_this, 'url') + '/progress';
      };
      this.users = new UserRoles;
      this.users.url = function() {
        return _.result(_this, 'url') + '/users';
      };
      this.head = new CourseHead({}, {
        course: this
      });
      this.head.url = function() {
        return _.result(_this, 'url') + '/head';
      };
      this.revisions = new CourseRevisions([], {
        course: this
      });
      this.revisions.url = function() {
        return _.result(_this, 'url') + '/revisions';
      };
      this.palette = new GadgetPalette([], {
        course: this
      });
      options.parse = true;
      Backbone.Model.call(this, attrs, options);
    }

    Course.prototype.parse = function(attrs) {
      if (attrs.authors) {
        this.authors.set(attrs.authors, {
          parse: true
        });
      }
      if (attrs.lessons) {
        this.lessons.set(attrs.lessons, {
          parse: true
        });
      }
      if (attrs.revisions) {
        this.revisions.set(attrs.revisions, {
          parse: true
        });
      }
      if (attrs.head) {
        this.head.set(_.clone(attrs.head), {
          silent: true
        });
      }
      if (attrs.palette) {
        this.palette.set(attrs.palette, {
          parse: true
        });
      }
      if (attrs.currentPosition) {
        this.progress.set({
          lessonIndex: attrs.currentPosition.currentLesson
        });
      }
      return _.omit(attrs, 'lessons', 'authors', 'revisions', 'head', 'progress', 'palette');
    };

    Course.prototype.toJSON = function(options) {
      var result;
      if (options == null) {
        options = {};
      }
      result = _.clone(this.attributes);
      if (options.lessons) {
        result.lessons = this.lessons.toJSON(options);
      }
      if (options.palette) {
        result.palette = this.palette.toJSON(options);
      }
      return result;
    };

    Course.prototype.validate = function(attrs, options) {
      if (!attrs.title) {
        return 'Title must be not empty';
      }
    };

    Course.prototype.stage = function(options) {
      var revision,
        _this = this;
      if (options == null) {
        options = {};
      }
      return revision = this.revisions.create({}, {
        error: options.error,
        success: function() {
          var stagedCatalog;
          stagedCatalog = new Catalog({
            id: 'staged'
          });
          return stagedCatalog.courses.create(revision.toJSON(), {
            error: options.error,
            success: function() {
              var _ref;
              return (_ref = options.success) != null ? _ref.call(_this, _this) : void 0;
            }
          });
        }
      });
    };

    Course.prototype.start = function(options) {
      if (options == null) {
        options = {};
      }
      options.attrs = {};
      options.url = _.result(this, 'url') + '/start';
      return this.sync('create', this, options);
    };

    Course.prototype.complete = function(options) {
      if (options == null) {
        options = {};
      }
      options.attrs = {};
      options.url = _.result(this, 'url') + '/completion';
      return this.sync('update', this, options);
    };

    Course.prototype.isStaged = function() {
      return _.contains(this.get('catalogs'), 'staged');
    };

    Course.prototype.isPublished = function() {
      return this.isStaged() || _.contains(this.get('catalogs'), 'labs');
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

define('models/organization',['require','exports','module','backbone','underscore','../collections/user_roles','../collections/courses'],function (require, exports, module) {(function() {
  var Backbone, Courses, Organization, UserRoles, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  UserRoles = require('../collections/user_roles');

  Courses = require('../collections/courses');

  Organization = (function(_super) {
    __extends(Organization, _super);

    Organization.prototype.urlRoot = '/orgs';

    Organization.prototype.defaults = {
      orgTitle: 'Your team name'
    };

    function Organization(attrs, options) {
      var _this = this;
      if (attrs == null) {
        attrs = {};
      }
      if (options == null) {
        options = {};
      }
      this.users = new UserRoles;
      this.users.url = function() {
        return _.result(_this, 'url') + '/users';
      };
      this.courses = new Courses;
      this.courses.url = function() {
        return _.result(_this, 'url') + '/courses';
      };
      options.parse = true;
      Backbone.Model.call(this, attrs, options);
    }

    return Organization;

  })(Backbone.Model);

  module.exports = Organization;

}).call(this);

});

define('models/partnerkey',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, PartnerKey, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  PartnerKey = (function(_super) {
    __extends(PartnerKey, _super);

    function PartnerKey() {
      _ref = PartnerKey.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PartnerKey.prototype.urlRoot = '/partnerkeys';

    PartnerKey.prototype.defaults = {
      key: ''
    };

    return PartnerKey;

  })(Backbone.Model);

  module.exports = PartnerKey;

}).call(this);

});

define('models/tag',['require','exports','module','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, Tag, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  _ = require('underscore');

  Tag = (function(_super) {
    __extends(Tag, _super);

    function Tag() {
      _ref = Tag.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Tag.prototype.urlRoot = function() {
      return '/tag';
    };

    Tag.prototype.idAttribute = 'path';

    Tag.prototype.validate = function(attrs, options) {
      if (options == null) {
        options = {};
      }
      if (!attrs.path) {
        return 'path is required to upload a tag';
      }
    };

    return Tag;

  })(Backbone.Model);

  module.exports = Tag;

}).call(this);

});

define('collections/tags',['require','exports','module','../models/tag','backbone','underscore'],function (require, exports, module) {(function() {
  var Backbone, Tag, Tags, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Tag = require('../models/tag');

  Backbone = require('backbone');

  _ = require('underscore');

  Tags = (function(_super) {
    __extends(Tags, _super);

    function Tags() {
      _ref = Tags.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Tags.prototype.url = function() {
      return '/tags';
    };

    Tags.prototype.model = Tag;

    Tags.prototype.fetchByField = function(field, val, params) {
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

    Tags.prototype.fetchByPath = function(path, params) {
      return this.fetchByField('path', path, params);
    };

    return Tags;

  })(Backbone.Collection);

  module.exports = Tags;

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
        formData.append(key, this.normalizeValue(val));
      }
      return formData;
    };

    BrowserUploadAdapter.prototype.normalizeValue = function(val) {
      if (val instanceof File || val instanceof Blob) {
        return val;
      }
      if (_.isArray(val) || _.isObject(val)) {
        return JSON.stringify(val);
      }
      return val;
    };

    BrowserUploadAdapter.prototype.sendRequest = function(options) {};

    return BrowserUploadAdapter;

  })();

}).call(this);

});

define('api',['require','exports','module','backbone','jquery','./pagination','underscore','./helpers/backbone_collection_move','./models/asset','./collections/assets','./models/asset_representation','./collections/asset_representations','./models/catalog','./collections/catalogs','./models/course','./collections/courses','./models/course_head','./models/course_progress','./models/course_revision','./collections/course_revisions','./models/gadget','./collections/gadgets','./models/gadget_palette','./models/gadget_project','./collections/gadget_projects','./collections/gadget_userstates','./models/lesson','./collections/lessons','./models/organization','./models/partnerkey','./models/tag','./collections/tags','./models/user','./collections/users','./models/user_role','./collections/user_roles','./models/gadget','./api_errors','./adapters/node','./adapters/browser'],function (require, exports, module) {(function() {
  var Backbone, Pagination, api, _,
    __slice = [].slice;

  Backbone = require('backbone');

  Backbone.$ = require('jquery');

  Pagination = require('./pagination');

  _ = require('underscore');

  require('./helpers/backbone_collection_move');

  module.exports = api = {
    Backbone: Backbone,
    Asset: require('./models/asset'),
    Assets: require('./collections/assets'),
    AssetRepresentation: require('./models/asset_representation'),
    AssetRepresentations: require('./collections/asset_representations'),
    Catalog: require('./models/catalog'),
    Catalogs: require('./collections/catalogs'),
    Course: require('./models/course'),
    Courses: require('./collections/courses'),
    CourseHead: require('./models/course_head'),
    CourseProgress: require('./models/course_progress'),
    CourseRevision: require('./models/course_revision'),
    CourseRevisions: require('./collections/course_revisions'),
    Gadget: require('./models/gadget'),
    Gadgets: require('./collections/gadgets'),
    GadgetPalette: require('./models/gadget_palette'),
    GadgetProject: require('./models/gadget_project'),
    GadgetProjects: require('./collections/gadget_projects'),
    GadgetUserStates: require('./collections/gadget_userstates'),
    Lesson: require('./models/lesson'),
    Lessons: require('./collections/lessons'),
    Organization: require('./models/organization'),
    PartnerKey: require('./models/partnerkey'),
    Tag: require('./models/tag'),
    Tags: require('./collections/tags'),
    User: require('./models/user'),
    Users: require('./collections/users'),
    UserRole: require('./models/user_role'),
    UserRoles: require('./collections/user_roles'),
    GadgetInstance: require('./models/gadget'),
    Pagination: Pagination,
    errors: require('./api_errors'),
    errorHandler: function(model, resp, options) {
      var desc, errors;
      if (options == null) {
        options = {};
      }
      if (model instanceof Error) {
        return model;
      } else if (resp && resp.status) {
        errors = api.errors;
        desc = [resp.status, _.result(model, 'url'), resp.responseText].join(' ');
        switch (resp.status) {
          case 401:
          case 403:
            return new errors.PermissionDenied(desc);
          case 404:
            return new errors.NotFound(desc);
          default:
            return new errors.ApplicationError(desc);
        }
      } else {
        return new Error('Unexpected result to error handler: ' + JSON.stringify(arguments));
      }
    },
    connect: function(options) {
      if (!options.url) {
        throw new Error('url is required to connect to the API');
      }
      this.apiUrl = options.url.replace(/\/$/, '');
      this.apiKey = options.apiKey;
      this.sessionIdKey = options.sessionIdKey || 'SESSION_ID';
      this.sessionId = options.sessionId;
      this.Asset.prototype.baseUrl = this.apiUrl;
      return this.GadgetProject.prototype.apiUrl = this.apiUrl;
    },
    setSIDHeader: function(xhr, options) {
      var value;
      value = (options != null ? options.useApiKey : void 0) ? this.apiKey : this.sessionId;
      if (!(this.sessionIdKey && value)) {
        return;
      }
      return xhr.setRequestHeader(this.sessionIdKey, value);
    },
    init: function(options) {
      var ajax, sync,
        _this = this;
      if (options == null) {
        options = {};
      }
      _.extend(this, Backbone.Events);
      this.uploadAdapter = (options != null ? options.uploadAdapter : void 0) || this.getUploadAdapter();
      if (!options.url) {
        options.url = options.apiUrl;
      }
      if (options.url) {
        this.connect(options);
      }
      this.GadgetProject.prototype.requirejs = options.requirejs;
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
        return Backbone.sync = function(method, model, options) {
          var beforeSend, success, urlPath, xhr;
          if (options == null) {
            options = {};
          }
          options = _.clone(options);
          urlPath = options.url || _.result(model, 'url');
          if (urlPath.match(/^https?:\/\//)) {
            options.url = urlPath;
          } else {
            options.url = _this.apiUrl + urlPath;
          }
          beforeSend = options.beforeSend;
          options.beforeSend = function(xhr) {
            _this.setSIDHeader(xhr, options);
            if (beforeSend) {
              return beforeSend.apply(_this, arguments);
            }
          };
          if (options.upload) {
            options.data = _this.uploadAdapter.createFormData(model);
          }
          success = options.success || _.identity;
          options.success = _.wrap(success, function() {
            var args, func, pageHeader;
            func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (pageHeader = typeof xhr.getResponseHeader === "function" ? xhr.getResponseHeader('X-Pagination') : void 0) {
              model.pagination = new Pagination(JSON.parse(pageHeader));
            }
            return func.apply(this, args);
          });
          xhr = sync.apply(_this, arguments);
          xhr.requestUrl = options.url;
          if (_.isFunction(xhr.done)) {
            api.trigger('xhr:start', xhr);
            xhr.done(_.bind(api.trigger, api, 'xhr:success'));
            xhr.fail(_.bind(api.trigger, api, 'xhr:error'));
          }
          return xhr;
        };
      }
    },
    getUploadAdapter: function() {
      var isNode;
      isNode = typeof Buffer !== 'undefined';
      if (isNode) {
        return new (require('./adapters/node'));
      } else {
        return new (require('./adapters/browser'));
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