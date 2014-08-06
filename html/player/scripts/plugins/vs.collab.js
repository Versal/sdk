/*!
 * js-collab v0.2.1
 * lovingly baked from d3ce2df on 30. July 2014
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    // Deprecate this as soon as player adopts loading API as AMD module
    if (!root.vs) {
      root.vs = {};
    }
    root.vs.collab = factory();
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

(function() {
  define('vent',['underscore', 'backbone'], function(_, Backbone) {
    var Vent;
    Vent = (function() {
      function Vent() {}

      _.extend(Vent.prototype, Backbone.Events);

      return Vent;

    })();
    return new Vent();
  });

}).call(this);

/*
Each instance of Handler will listen to three things:
  1) @serverEvents (@conn) -- for events coming from the collab server
  2) @localEvents (vent) -- for events coming locally from views, collab, etc.
  3) @playerEvents (@mediator) -- for events coming from player
*/


(function() {
  define('handler',['vent'], function(vent) {
    var Handler;
    return Handler = (function() {
      function Handler(conn) {
        this.conn = conn;
        this.mediator = this.conn.mediator;
        this.conn.on('ws:open', this.listen, this);
        this.conn.on('ws:close', this.stopListening, this);
      }

      Handler.prototype.listen = function() {
        var handler, name, _ref, _ref1, _ref2, _results;
        if (this.serverEvents) {
          _ref = this.serverEvents;
          for (name in _ref) {
            handler = _ref[name];
            this.conn.on(name, this[handler], this);
          }
        }
        if (this.localEvents) {
          _ref1 = this.localEvents;
          for (name in _ref1) {
            handler = _ref1[name];
            vent.on(name, this[handler], this);
          }
        }
        if (this.playerEvents) {
          _ref2 = this.playerEvents;
          _results = [];
          for (name in _ref2) {
            handler = _ref2[name];
            _results.push(this.mediator.on(name, this[handler], this));
          }
          return _results;
        }
      };

      Handler.prototype.stopListening = function() {
        var handler, name, _ref, _ref1, _ref2, _results;
        if (this.serverEvents) {
          _ref = this.serverEvents;
          for (name in _ref) {
            handler = _ref[name];
            this.conn.off(name, this[handler], this);
          }
        }
        if (this.localEvents) {
          _ref1 = this.localEvents;
          for (name in _ref1) {
            handler = _ref1[name];
            vent.off(name, this[handler], this);
          }
        }
        if (this.playerEvents) {
          _ref2 = this.playerEvents;
          _results = [];
          for (name in _ref2) {
            handler = _ref2[name];
            _results.push(this.mediator.off(name, this[handler], this));
          }
          return _results;
        }
      };

      return Handler;

    })();
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('models/user',['backbone'], function(Backbone) {
    var User, _ref;
    return User = (function(_super) {
      __extends(User, _super);

      function User() {
        _ref = User.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      return User;

    })(Backbone.Model);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('collections/users',['backbone', 'models/user'], function(Backbone, User) {
    var Users, _ref;
    return Users = (function(_super) {
      __extends(Users, _super);

      function Users() {
        _ref = Users.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Users.prototype.model = User;

      return Users;

    })(Backbone.Collection);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('handlers/users',['underscore', 'handler', 'collections/users', 'vent'], function(_, Handler, Users, vent) {
    var UsersHandler, _ref;
    return UsersHandler = (function(_super) {
      __extends(UsersHandler, _super);

      function UsersHandler() {
        _ref = UsersHandler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      UsersHandler.prototype.playerEvents = {
        'gadget:activity': 'onGadgetActivity'
      };

      UsersHandler.prototype.serverEvents = {
        'user:me': 'onUserIdentity',
        'users:list': 'onUsersList',
        'user:add': 'onUserAdd',
        'user:remove': 'onUserRemove'
      };

      UsersHandler.prototype.onUserIdentity = function(user) {
        return this.conn.me = user;
      };

      UsersHandler.prototype.onGadgetActivity = function() {
        return this.conn.resetLastActivity();
      };

      UsersHandler.prototype.onUsersList = function(users) {
        this._activeUsers = new Users(users);
        return vent.trigger('activeUsers:update', this._activeUsers);
      };

      UsersHandler.prototype.onUserAdd = function(user) {
        this._activeUsers.add(user);
        return vent.trigger('activeUsers:update', this._activeUsers);
      };

      UsersHandler.prototype.onUserRemove = function(user) {
        this._activeUsers.remove(this._activeUsers.get(user.id));
        return vent.trigger('activeUsers:update', this._activeUsers);
      };

      return UsersHandler;

    })(Handler);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('models/gadget_lock',['backbone'], function(Backbone) {
    var GadgetLock, _ref;
    return GadgetLock = (function(_super) {
      __extends(GadgetLock, _super);

      function GadgetLock() {
        _ref = GadgetLock.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetLock.prototype.defaults = function() {
        return {
          createdAt: new Date
        };
      };

      GadgetLock.prototype.isLockedByMe = function() {
        return !!this.get('editable');
      };

      return GadgetLock;

    })(Backbone.Model);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('handlers/locks',['underscore', 'handler', 'models/gadget_lock', 'vent'], function(_, Handler, GadgetLock, vent) {
    var LocksHandler, _ref;
    return LocksHandler = (function(_super) {
      __extends(LocksHandler, _super);

      function LocksHandler() {
        _ref = LocksHandler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LocksHandler.prototype.serverEvents = {
        'locks:list': 'onLocksList',
        'lock:lock': 'onLock',
        'lock:unlock': 'onUnlock'
      };

      LocksHandler.prototype.playerEvents = {
        'gadget:editing:start': 'onGadgetEditing',
        'gadget:editing:stop': 'onGadgetStopEditing'
      };

      LocksHandler.prototype.onLocksList = function(locks) {
        var _this = this;
        locks.each(function(lock) {
          return vent.trigger('lock:lock', lock);
        });
        return this.conn.activeLocks.reset(locks.models);
      };

      LocksHandler.prototype.onGadgetEditing = function(gadget) {
        var lock;
        this.conn.triggerEvent('lock:lock', {
          gadgetId: gadget.id
        });
        lock = new GadgetLock({
          gadgetId: gadget.id,
          user: this.conn.me,
          editable: true
        });
        return vent.trigger('lock:lock', lock);
      };

      LocksHandler.prototype.onGadgetStopEditing = function(gadget) {
        return this.conn.triggerEvent('lock:unlock', {
          gadgetId: gadget.id
        });
      };

      LocksHandler.prototype.onLock = function(lock) {
        this.conn.activeLocks.add(lock);
        return vent.trigger('lock:lock', lock);
      };

      LocksHandler.prototype.onUnlock = function(lock) {
        this.conn.activeLocks.remove(this.conn.activeLocks.findWhere({
          gadgetId: lock.get('gadgetId')
        }));
        return vent.trigger('lock:unlock', lock);
      };

      return LocksHandler;

    })(Handler);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('models/gadget_comment',['backbone'], function(Backbone) {
    var GadgetComment, _ref;
    return GadgetComment = (function(_super) {
      __extends(GadgetComment, _super);

      function GadgetComment() {
        _ref = GadgetComment.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetComment.prototype.editable = false;

      GadgetComment.prototype.defaults = function() {
        return {
          createdAt: new Date,
          deleted: false
        };
      };

      GadgetComment.prototype.isDeleted = function() {
        return !!this.get('deleted');
      };

      return GadgetComment;

    })(Backbone.Model);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('collections/gadget_comments',['backbone', 'models/gadget_comment'], function(Backbone, GadgetComment) {
    var GadgetComments, _ref;
    return GadgetComments = (function(_super) {
      __extends(GadgetComments, _super);

      function GadgetComments() {
        _ref = GadgetComments.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetComments.prototype.model = GadgetComment;

      return GadgetComments;

    })(Backbone.Collection);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('collections/collapsible_gadget_comments',['backbone', 'collections/gadget_comments', 'models/gadget_comment'], function(Backbone, GadgetComments, GadgetComment) {
    var CollapsibleGadgetComments, _ref;
    return CollapsibleGadgetComments = (function(_super) {
      __extends(CollapsibleGadgetComments, _super);

      function CollapsibleGadgetComments() {
        _ref = CollapsibleGadgetComments.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CollapsibleGadgetComments.prototype.initialize = function() {
        this._shadowedCollection = new GadgetComments;
        this._shadowedCollection.listenTo(this, 'all', this._onModelEvent);
        return this.model = GadgetComment;
      };

      CollapsibleGadgetComments.prototype.collapseDeletedComments = function(model) {
        var index,
          _this = this;
        if (!model || model instanceof Backbone.Collection) {
          this.models.forEach(function(model) {
            return _this.collapseDeletedComments(model);
          });
          return;
        }
        index = this.models.indexOf(model);
        if (index === -1) {
          return;
        }
        if (!model.get('deleted')) {
          return;
        }
        model._deletedStreak = [1, -1].reduce(function(streak, offset) {
          var neighborModel;
          neighborModel = _this.at(index + offset);
          if (neighborModel && neighborModel.get('deleted')) {
            _this.remove(neighborModel);
            if (neighborModel._deletedStreak != null) {
              return streak + neighborModel._deletedStreak;
            }
            return streak + 1;
          } else {
            return streak;
          }
        }, 1);
        return model.trigger('change');
      };

      return CollapsibleGadgetComments;

    })(GadgetComments);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('handlers/comments',['underscore', 'handler', 'vent', 'collections/collapsible_gadget_comments'], function(_, Handler, vent, CollapsibleGadgetComments) {
    var CommentsHandler;
    return CommentsHandler = (function(_super) {
      __extends(CommentsHandler, _super);

      CommentsHandler.prototype._unresolvedIds = {};

      CommentsHandler.prototype.serverEvents = {
        'comments:list': 'onCommentsList',
        'comment:resolve': 'onCommentResolve',
        'comment:add': 'onCommentAdd',
        'comment:delete': 'onCommentDelete'
      };

      CommentsHandler.prototype.localEvents = {
        'comment:deleted': 'onCommentDeleted',
        'comment:added': 'onCommentAdded',
        'commentsView:ready': 'replayCommentsList'
      };

      function CommentsHandler() {
        this._commentsListed = [];
        CommentsHandler.__super__.constructor.apply(this, arguments);
      }

      CommentsHandler.prototype.onCommentsList = function(comments) {
        var _this = this;
        vent.trigger('comments:ready');
        this._commentsListed = [];
        return this._personalizeCollection(comments).each(function(comment) {
          _this.onCommentAdd(comment);
          return _this._commentsListed.push(comment);
        });
      };

      CommentsHandler.prototype.replayCommentsList = function() {
        return this._commentsListed.forEach(function(comment) {
          return vent.trigger('comment:add', comment);
        });
      };

      CommentsHandler.prototype.onCommentResolve = function(_comment) {
        var cid, comment;
        cid = _comment.get('cid');
        comment = this._unresolvedIds[cid];
        if (comment) {
          comment.set({
            id: _comment.id
          });
          return delete this._unresolvedIds[cid];
        }
      };

      CommentsHandler.prototype.onCommentAdd = function(comment) {
        vent.trigger('comment:add', comment);
        return this._commentsListed.push(comment);
      };

      CommentsHandler.prototype.onCommentDelete = function(comment) {
        return vent.trigger('comment:delete', comment);
      };

      CommentsHandler.prototype.onCommentAdded = function(comment) {
        this._commentsListed.push(comment);
        this._pendComment(comment);
        return this.conn.triggerEvent('comment:add', {
          gadgetId: comment.get('gadgetId'),
          body: comment.get('body'),
          cid: comment.cid
        });
      };

      CommentsHandler.prototype.onCommentDeleted = function(comment) {
        var deletion;
        deletion = {
          gadgetId: comment.get('gadgetId'),
          commentId: comment.id
        };
        return this.conn.triggerEvent('comment:delete', deletion);
      };

      CommentsHandler.prototype._personalizeCollection = function(collection) {
        var _this = this;
        collection.each(function(item) {
          if (item.get('user').id === _this.conn.me.id) {
            return item.editable = true;
          }
        });
        return collection;
      };

      CommentsHandler.prototype._pendComment = function(comment) {
        return this._unresolvedIds[comment.cid] = comment;
      };

      return CommentsHandler;

    })(Handler);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('handlers/updates',['handler', 'vent'], function(Handler, vent) {
    var UpdatesHandler, _ref;
    return UpdatesHandler = (function(_super) {
      __extends(UpdatesHandler, _super);

      function UpdatesHandler() {
        _ref = UpdatesHandler.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      UpdatesHandler.prototype.serverEvents = {
        'course:update': '_onCourseUpdate'
      };

      UpdatesHandler.prototype.playerEvents = {
        'lesson:gadget:added': '_onLessonChanged',
        'lesson:gadget:moved': '_onLessonChanged',
        'lesson:gadget:deleted': '_onLessonChanged',
        'gadget:changed': '_onGadgetChanged'
      };

      UpdatesHandler.prototype._onLessonChanged = function(lesson, gadget) {
        if (gadget) {
          return this.conn.triggerEvent('course:update', {
            gadgetId: gadget.id
          });
        } else {
          return this.conn.triggerEvent('course:update');
        }
      };

      UpdatesHandler.prototype._onGadgetChanged = function(gadget) {
        return this.conn.triggerEvent('course:update', {
          gadgetId: gadget.id
        });
      };

      UpdatesHandler.prototype._onCourseUpdate = function(update) {
        this.conn.updates.push(update);
        return vent.trigger('collab:update');
      };

      return UpdatesHandler;

    })(Handler);
  });

}).call(this);

/**
 * @license RequireJS text 2.0.12 Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.12',

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
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

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
            !!process.versions.node &&
            !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
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
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
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

                if (line !== null) {
                    stringBuffer.append(line);
                }

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
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});


define('text!templates/contributor.html',[],function () { return '<a href="<%- userUrl %>" target="_blank">\n  <img src="<%- thumbnail %>" alt="<%- name() %>" class="contrib-icon" title="<%- name() %>">\n</a>\n';});


define('text!templates/contributors.html',[],function () { return '<h4>Contributors</h4>\n<div class="js-toggle-collapse">\n  <i class="collapse icon-double-angle-down"></i>\n  <i class="expand icon-double-angle-up"></i>\n</div>\n<ul class="icons js-icons"></ul>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/contributors',['backbone', 'backbone.marionette', 'text!templates/contributor.html', 'text!templates/contributors.html', 'vent'], function(Backbone, Marionette, contributorTemplate, contributorsTemplate, vent) {
    var ContributorView, ContributorsView, _ref, _ref1;
    ContributorView = (function(_super) {
      __extends(ContributorView, _super);

      function ContributorView() {
        this.templateHelpers = __bind(this.templateHelpers, this);
        _ref = ContributorView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ContributorView.prototype.initialize = function(_arg) {
        this.site = _arg.site;
      };

      ContributorView.prototype.template = _.template(contributorTemplate);

      ContributorView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          thumbnail: this.getThumbnail(),
          name: function() {
            return _this.model.get('firstname') || _this.model.get('fn') || 'Anonymous';
          },
          site: this.site,
          userUrl: "" + this.site + "/u/" + this.model.id
        };
      };

      ContributorView.prototype.tagName = 'li';

      ContributorView.prototype.className = 'contributor';

      ContributorView.prototype.getThumbnail = function() {
        var icon, _ref1;
        icon = _.findWhere((_ref1 = this.model.get('image')) != null ? _ref1.representations : void 0, {
          scale: '40x40'
        });
        return (icon != null ? icon.location : void 0) || ("" + this.site + "/assets/img/defaults/profile-retina.jpg");
      };

      return ContributorView;

    })(Marionette.ItemView);
    return ContributorsView = (function(_super) {
      __extends(ContributorsView, _super);

      function ContributorsView() {
        this.initialize = __bind(this.initialize, this);
        _ref1 = ContributorsView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ContributorsView.prototype.initialize = function(_arg) {
        this.mediator = _arg.mediator, this.conn = _arg.conn, this.site = _arg.site;
        return this.collection = new Backbone.Collection;
      };

      ContributorsView.prototype.onShow = function() {
        this.conn.on('ws:open', this.render, this);
        this.conn.on('ws:close', this.render, this);
        this.listenTo(this, 'composite:collection:rendered', this.onCollectionRender);
        return vent.on('activeUsers:update', this._onActiveUsersChange, this);
      };

      ContributorsView.prototype.onClose = function() {
        this.conn.off('ws:open', this.render, this);
        this.conn.off('ws:close', this.render, this);
        return vent.off('activeUsers:update', this._onActiveUsersChange, this);
      };

      ContributorsView.prototype.itemView = ContributorView;

      ContributorsView.prototype.itemViewOptions = function() {
        return {
          site: this.site
        };
      };

      ContributorsView.prototype.itemViewContainer = '.js-icons';

      ContributorsView.prototype.template = _.template(contributorsTemplate);

      ContributorsView.prototype.className = 'contributors';

      ContributorsView.prototype.onCollectionRender = function() {
        this.$el.toggle(!!this.conn.enabled && this.collection.length > 0);
        return this.trigger('sizeChanged');
      };

      ContributorsView.prototype.events = {
        'click .js-toggle-collapse': 'onCollapseToggle'
      };

      ContributorsView.prototype.onCollapseToggle = function() {
        this.$el.toggleClass('collapsed');
        return this.trigger('toggleCollapse');
      };

      ContributorsView.prototype._onActiveUsersChange = function(users) {
        return this.collection.reset(users.models);
      };

      return ContributorsView;

    })(Marionette.CompositeView);
  });

}).call(this);

// Generated by CoffeeScript 1.7.1
(function() {
  define('plugins/time_since',[], function() {
    return function(date) {
      var diff, label, max, min, unit, unitCount, _i, _len, _ref, _ref1;
      diff = (+(new Date)) - date;
      if (diff <= 30 * 1000) {
        label = 'seconds';
      } else if ((30 * 1000 < diff && diff <= 60 * 1000)) {
        label = 'less than a minute';
      } else {
        _ref = [['minute', 60 * 1000, 60 * 60 * 1000], ['hour', 60 * 60 * 1000, 24 * 60 * 60 * 1000], ['day', 24 * 60 * 60 * 1000, Infinity]];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], unit = _ref1[0], min = _ref1[1], max = _ref1[2];
          if ((min < diff && diff <= max)) {
            unitCount = Math.floor(diff / min);
            label = "" + unitCount + " " + unit;
            if (unitCount > 1) {
              label += 's';
            }
          }
        }
      }
      return label;
    };
  });

}).call(this);


define('text!templates/gadget_comment.html',[],function () { return '<% if (deleted && deletedStreak() > 1) { %>\n  <div class="deleted_comment">\n    <p><%= deletedStreak() %> comments have been deleted</p>\n  </div>\n<% } else if (deleted) { %>\n  <div class="deleted_comment">\n    <p>Comment has been deleted</p>\n  </div>\n<% } else { %>\n  <div class="comment-inner">\n    <div class=\'js-delete-overlay delete-overlay\'>\n      <div class=\'delete-content\'>\n        Delete this comment?\n        <button class=\'js-cancel-delete\'>no</button>\n        <button class=\'js-confirm-delete action\'>yes</button>\n      </div>\n    </div>\n    <img src="<%- profileImage() %>"></img>\n    <div class="commentInfo">\n      <p class="commentAuthor"><%- name() %></p><br/>\n      <p class="commentDate"><span class="js-timestamp timestamp">seconds</span> ago</p>\n    </div>\n    <p class="js-comment-body comment-body"><%= body() %></p>\n    <div class="js-comment-actions comment-actions">\n      <span class="js-show comment-action show-more">show more</span>\n      <span class="js-show comment-action show-less">show less</span>\n      <% if (isDeletable()) { %>\n        <span class="js-delete-comment delete-comment comment-action pull-right">delete</span>\n      <% } %>\n    </div>\n  </div>\n<% } %>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/comment',['backbone.marionette', 'plugins/time_since', 'text!templates/gadget_comment.html', 'vent'], function(Marionette, timeSince, template, vent) {
    var GadgetCommentView, _ref;
    return GadgetCommentView = (function(_super) {
      __extends(GadgetCommentView, _super);

      function GadgetCommentView() {
        this.updateTimeSince = __bind(this.updateTimeSince, this);
        this.profileImage = __bind(this.profileImage, this);
        this.sanitizeBody = __bind(this.sanitizeBody, this);
        _ref = GadgetCommentView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetCommentView.prototype.updateTimeSinceEveryMs = 10 * 1000;

      GadgetCommentView.prototype.className = 'comment';

      GadgetCommentView.prototype.events = {
        'click .js-delete-comment': '_onDeleteClick',
        'click .js-show': 'toggleShow',
        'click .js-confirm-delete': '_onConfirmDelete',
        'click .js-cancel-delete': '_onCancelDelete'
      };

      GadgetCommentView.prototype.template = _.template(template);

      GadgetCommentView.prototype.ui = {
        createdAt: '.js-timestamp',
        commentBody: '.js-comment-body',
        deleteOverlay: '.js-delete-overlay'
      };

      GadgetCommentView.prototype.initialize = function(_arg) {
        this.site = _arg.site, this.mediator = _arg.mediator;
        return this.listenTo(this.model, 'change', this.render);
      };

      GadgetCommentView.prototype.toggleShow = function() {
        this.$el.toggleClass('expanded');
        return this.$el.toggleClass('compacted');
      };

      GadgetCommentView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          profileImage: this.profileImage,
          name: function() {
            var _ref1, _ref2;
            return ((_ref1 = _this.model.get('user')) != null ? _ref1.firstname : void 0) || ((_ref2 = _this.model.get('user')) != null ? _ref2.fn : void 0) || 'Anonymous';
          },
          body: this.sanitizeBody,
          deletedStreak: function() {
            return _this.model._deletedStreak;
          },
          isDeletable: function() {
            return _this.model.editable && !_this.model.isNew();
          }
        };
      };

      GadgetCommentView.prototype.sanitizeBody = function() {
        var sub, substitutions, text, type;
        text = _.escape(this.model.get('body'));
        substitutions = {
          http: {
            "in": /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
            out: '<a href="$1" target="_blank">$1</a>'
          },
          www: {
            "in": /(^|[^\/])(www\.[\S]+(\b|$))/gim,
            out: '$1<a href="http://$2" target="_blank">$2</a>'
          },
          email: {
            "in": /(^\S+@\S+\.\S+$)/gi,
            out: '<a href="mailto:$1">$1</a>'
          },
          newlines: {
            "in": /\n/g,
            out: '<br>'
          }
        };
        for (type in substitutions) {
          sub = substitutions[type];
          text = text.replace(sub["in"], sub.out);
        }
        return text;
      };

      GadgetCommentView.prototype.profileImage = function() {
        var image, user;
        user = this.model.get('user');
        if (user != null ? user.image : void 0) {
          image = _.find(user.image.representations, function(representation) {
            return representation.scale === "140x140";
          });
          return image.location;
        } else {
          return "" + this.site + "/assets/img/defaults/profile-retina.jpg";
        }
      };

      GadgetCommentView.prototype.onRender = function() {
        return this.updateTimeSince();
      };

      GadgetCommentView.prototype.onShow = function() {
        return this.determineHeight();
      };

      GadgetCommentView.prototype.onClose = function() {
        return this.stopUpdatingTimeSince();
      };

      GadgetCommentView.prototype.startUpdatingTimeSince = function() {
        if (!(this.timeSinceUpdater || this.model.get('deleted'))) {
          return this.timeSinceUpdater = setInterval(this.updateTimeSince, this.updateTimeSinceEveryMs);
        }
      };

      GadgetCommentView.prototype.stopUpdatingTimeSince = function() {
        return clearInterval(this.timeSinceUpdater);
      };

      GadgetCommentView.prototype._onDeleteClick = function() {
        return this.ui.deleteOverlay.show();
      };

      GadgetCommentView.prototype._onConfirmDelete = function() {
        this.ui.deleteOverlay.hide();
        this.model.set({
          deleted: true
        });
        return vent.trigger('comment:deleted', this.model);
      };

      GadgetCommentView.prototype._onCancelDelete = function() {
        return this.ui.deleteOverlay.hide();
      };

      GadgetCommentView.prototype.updateTimeSince = function() {
        var commentDate;
        commentDate = new Date(this.model.get('createdAt'));
        return this.ui.createdAt.text(timeSince(commentDate));
      };

      GadgetCommentView.prototype.determineHeight = function() {
        if (this.ui.commentBody.height() > 145) {
          return this.$el.addClass('compacted');
        }
      };

      return GadgetCommentView;

    })(Marionette.ItemView);
  });

}).call(this);


define('text!templates/gadget_comments.html',[],function () { return '<ul class="comments-toolbar">\n  <li class="actions">\n    <span class="comments js-comments">\n      <span class="js-comments-toggle comments-toggle icon-stack">\n        <i class="fv-bubble icon-stack-base"></i>\n        <i class="js-comments-count icon-inner-text"><%- commentCount %></i>\n      </span>\n      <div class="js-comments-box comments-box">\n        <div class="js-inner-comments inner-comments"></div>\n        <textarea class="js-submit-comment-text submit-comment-text" maxlength="800" placeholder="Write a message here..."></textarea>\n        <div class="submit-action-buttons js-submit-action-buttons">\n          <button class="cancel-button js-cancel-comment ">cancel</button>\n          <button class="action submit-button js-submit-comment pull-right">submit</button>\n        </div>\n      </div>\n    </span>\n  </li>\n</ul>\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/comments',['backbone.marionette', 'views/comment', 'text!templates/gadget_comments.html', 'models/gadget_comment', 'collections/collapsible_gadget_comments', 'vent'], function(Marionette, GadgetCommentView, template, GadgetComment, CollapsibleGadgetComments, vent) {
    var GadgetCommentsView, _ref;
    return GadgetCommentsView = (function(_super) {
      __extends(GadgetCommentsView, _super);

      function GadgetCommentsView() {
        this.stopCommenting = __bind(this.stopCommenting, this);
        this.startCommenting = __bind(this.startCommenting, this);
        this.onCommentsToggled = __bind(this.onCommentsToggled, this);
        this.onCommentToggleClicked = __bind(this.onCommentToggleClicked, this);
        this._onCommentsChange = __bind(this._onCommentsChange, this);
        this.enable = __bind(this.enable, this);
        this.disable = __bind(this.disable, this);
        _ref = GadgetCommentsView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetCommentsView.prototype.className = 'comments-container';

      GadgetCommentsView.prototype.ui = {
        commentText: '.js-submit-comment-text',
        commentsCount: '.js-comments-count',
        commentsDisplay: '.js-comments-box',
        commentsSubmitButtons: '.js-submit-action-buttons',
        commentsBox: '.js-comments',
        innerCommentsBox: '.js-inner-comments'
      };

      GadgetCommentsView.prototype.events = {
        'click .js-comments-toggle': 'onCommentToggleClicked',
        'click .js-submit-comment': 'onCommentSubmit',
        'click .js-cancel-comment': 'onCommentCancel',
        'click': 'onClick'
      };

      GadgetCommentsView.prototype.template = _.template(template);

      GadgetCommentsView.prototype.templateHelpers = function() {
        return {
          commentCount: this.commentCount()
        };
      };

      GadgetCommentsView.prototype.itemView = GadgetCommentView;

      GadgetCommentsView.prototype.itemViewOptions = function() {
        return {
          site: this.site,
          mediator: this.mediator
        };
      };

      GadgetCommentsView.prototype.itemViewContainer = '.inner-comments';

      GadgetCommentsView.prototype.initialize = function(_arg) {
        this.mediator = _arg.mediator, this.site = _arg.site, this.conn = _arg.conn, this.model = _arg.model;
        this.gadget = this.model;
        this.delegateEvents();
        this.collection = new CollapsibleGadgetComments;
        return this.listenTo(this.collection, 'add remove reset change:deleted', this._onCommentsChange);
      };

      GadgetCommentsView.prototype.onRender = function() {
        if (this.conn.subscribed) {
          return this.enable();
        }
      };

      GadgetCommentsView.prototype.onShow = function() {
        vent.on('comment:add', this.addComment, this);
        vent.on('comment:delete', this.deleteComment, this);
        vent.on('comments:toggle', this.onCommentsToggled, this);
        vent.on('comments:ready', this.onReady, this);
        this.conn.on('ws:open', this.enable);
        this.conn.on('ws:close', this.disable);
        return vent.trigger('commentsView:ready', this.gadget.id);
      };

      GadgetCommentsView.prototype.onClose = function() {
        vent.off('comment:add', this.addComment, this);
        vent.off('comment:delete', this.deleteComment, this);
        vent.off('comments:toggle', this.onCommentsToggled, this);
        vent.off('comments:ready', this.onReady, this);
        this.conn.off('ws:open', this.enable);
        return this.conn.off('ws:close', this.disable);
      };

      GadgetCommentsView.prototype.onClick = function(e) {};

      GadgetCommentsView.prototype.onReady = function() {
        this.ready = true;
        return this.enable();
      };

      GadgetCommentsView.prototype.disable = function() {
        return this.$el.hide();
      };

      GadgetCommentsView.prototype.enable = function() {
        return this.$el.show();
      };

      GadgetCommentsView.prototype.addComment = function(comment) {
        var gadgetId;
        gadgetId = comment.get('gadgetId');
        if (gadgetId === this.gadget.id) {
          return this.collection.add(comment);
        }
      };

      GadgetCommentsView.prototype.deleteComment = function(event) {
        var _ref1;
        if (event.gadgetId === this.gadget.id) {
          return (_ref1 = this.collection.get(event.commentId)) != null ? _ref1.set({
            deleted: true
          }) : void 0;
        }
      };

      GadgetCommentsView.prototype.onCommentSubmit = function() {
        var comment;
        if (!this.ui.commentText.val()) {
          return;
        }
        comment = new GadgetComment({
          gadgetId: this.gadget.id,
          body: this.ui.commentText.val(),
          user: this.conn.me
        });
        comment.editable = true;
        this.ui.commentText.val('');
        this.addComment(comment);
        vent.trigger('comment:added', comment);
        return this.scrollToBottom();
      };

      GadgetCommentsView.prototype.commentCount = function() {
        var comments, count;
        comments = this.collection.reject(function(comment) {
          return comment.get('deleted');
        });
        count = comments.length;
        if (count > 99) {
          return '99+';
        } else if (count <= 0) {
          return '+';
        } else {
          return count;
        }
      };

      GadgetCommentsView.prototype._onCommentsChange = function(model) {
        this.collection.collapseDeletedComments(model);
        this.ui.commentsCount.text(this.commentCount());
        return this.children.each(function(view) {
          return view.startUpdatingTimeSince();
        });
      };

      GadgetCommentsView.prototype.hideComments = function() {
        return this.ui.commentsDisplay.hide();
      };

      GadgetCommentsView.prototype.onCommentCancel = function() {
        return this.ui.commentText.val('');
      };

      GadgetCommentsView.prototype.checkForCollapsedComments = function() {
        return this.children.each(function(view) {
          return view.determineHeight();
        });
      };

      GadgetCommentsView.prototype.scrollToBottom = function() {
        return this.ui.innerCommentsBox.scrollTop(this.ui.innerCommentsBox[0].scrollHeight);
      };

      GadgetCommentsView.prototype.show = function() {
        var bottom;
        this.$el.addClass('comments-visible');
        this.checkForCollapsedComments();
        bottom = this.ui.commentsDisplay.height() + this.ui.commentsDisplay.offset().top;
        this.ui.commentsDisplay.toggleClass('above', bottom > $('body').height());
        this.scrollToBottom();
        return this.ui.commentText.focus();
      };

      GadgetCommentsView.prototype.hide = function() {
        this.$el.removeClass('comments-visible');
        this.ui.commentsDisplay.removeClass('above');
        return this.children.each(function(view) {
          return view.stopUpdatingTimeSince();
        });
      };

      GadgetCommentsView.prototype.onCommentToggleClicked = function() {
        return vent.trigger('comments:toggle', this.gadget);
      };

      GadgetCommentsView.prototype.onCommentsToggled = function(gadget) {
        if (gadget.id === this.gadget.id) {
          return this.toggleCommenting();
        } else {
          return this.stopCommenting();
        }
      };

      GadgetCommentsView.prototype.toggleCommenting = function() {
        if (this.isCommenting()) {
          return this.stopCommenting();
        } else {
          return this.startCommenting();
        }
      };

      GadgetCommentsView.prototype.isCommenting = function() {
        return !!this.gadget.get('isCommenting');
      };

      GadgetCommentsView.prototype.startCommenting = function() {
        this.gadget.set({
          isCommenting: true
        });
        this.show();
        $(window).one('click', this.stopCommenting);
        return this.$el.on('click', this._prevent);
      };

      GadgetCommentsView.prototype.stopCommenting = function() {
        this.gadget.set({
          isCommenting: false
        });
        this.hide();
        $(window).off('click', this.stopCommenting);
        return this.$el.off('click', this._prevent);
      };

      GadgetCommentsView.prototype._prevent = function(e) {
        return e.stopPropagation();
      };

      return GadgetCommentsView;

    })(Marionette.CompositeView);
  });

}).call(this);


define('text!templates/gadget_lock.html',[],function () { return '<i class="collab-lock-icon icon-lock"></i>\n<img class="collab-lock-avatar js-lock-avatar" src="<%- profileImage() %>"></img>\n';});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/lock',['backbone.marionette', 'text!templates/gadget_lock.html', 'vent'], function(Marionette, template, vent) {
    var CN_LOCKED, GadgetLockView, _ref;
    CN_LOCKED = 'gadget-locked';
    return GadgetLockView = (function(_super) {
      __extends(GadgetLockView, _super);

      function GadgetLockView() {
        _ref = GadgetLockView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetLockView.prototype.template = _.template(template);

      GadgetLockView.prototype.initialize = function(_arg) {
        this.model = _arg.model, this.site = _arg.site, this.mediator = _arg.mediator, this.conn = _arg.conn;
        return this.gadget = this.model;
      };

      GadgetLockView.prototype.onShow = function() {
        var _this = this;
        vent.on('lock:lock', this.onLockLocked, this);
        vent.on('lock:unlock', this.onLockUnlocked, this);
        this.conn.on('ws:close', this._unlock, this);
        return this.conn.activeLocks.each(function(lock) {
          return _this.onLockLocked(lock);
        });
      };

      GadgetLockView.prototype.onClose = function() {
        vent.off('lock:lock', this.onLockLocked, this);
        vent.off('lock:unlock', this.onLockUnlocked, this);
        return this.conn.off('ws:close', this._unlock, this);
      };

      GadgetLockView.prototype.ui = {
        'editor': '.js-lock-avator',
        'lock': '.icon-lock'
      };

      GadgetLockView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          isLocked: function() {
            return !!_this.gadget.lock;
          },
          name: function() {
            if (!_this.gadget.lock) {
              return;
            }
            return _this.gadget.lock.get('user').firstname || _this.gadget.lock.get('user').fn || 'Anonymous';
          },
          profileImage: function() {
            var image, representations, _ref1;
            if (!_this.gadget.lock) {
              return;
            }
            representations = (_ref1 = _this.gadget.lock.get('user').image) != null ? _ref1.representations : void 0;
            if (representations) {
              image = _.find(representations, function(representation) {
                return representation.scale === "140x140";
              });
              return image.location;
            } else {
              return "" + _this.site + "/assets/img/defaults/profile-retina.jpg";
            }
          }
        };
      };

      GadgetLockView.prototype.onLockLocked = function(lock) {
        if (lock.get('gadgetId') === this.gadget.id) {
          return this.updateLock(lock);
        }
      };

      GadgetLockView.prototype.updateLock = function(lock) {
        if (lock.get('user').id === this.conn.me.id) {
          return;
        }
        this.gadget.lock = lock;
        if (lock.user !== this.conn.me) {
          this.$el.closest('.gadget').toggleClass(CN_LOCKED, true);
        }
        return this.render();
      };

      GadgetLockView.prototype.onLockUnlocked = function(lock) {
        var gadgetId;
        gadgetId = lock.get('gadgetId');
        if (this.conn.gadgetHasUpdates(gadgetId)) {
          return;
        }
        if (this.gadget.lock && gadgetId === this.gadget.id) {
          return this._unlock();
        }
      };

      GadgetLockView.prototype._unlock = function() {
        if (!this.gadget.lock) {
          return;
        }
        if (this.gadget.lock.user !== this.conn.me) {
          this.$el.closest('.gadget').toggleClass(CN_LOCKED, false);
        }
        delete this.gadget.lock;
        return this.render();
      };

      return GadgetLockView;

    })(Marionette.ItemView);
  });

}).call(this);


define('text!templates/update.html',[],function () { return '<div class="updateNotification">\n  <i class="icon-refresh"></i><span class="updateNotificationMsg">See new update<span>\n</div>';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/update',['underscore', 'backbone.marionette', 'text!templates/update.html', 'vent'], function(_, Marionette, template, vent) {
    var UpdateView, _ref;
    return UpdateView = (function(_super) {
      __extends(UpdateView, _super);

      function UpdateView() {
        this.onCollabUpdate = __bind(this.onCollabUpdate, this);
        this.onCourseRefetchFail = __bind(this.onCourseRefetchFail, this);
        this.onCourseRefetchSuccess = __bind(this.onCourseRefetchSuccess, this);
        this.onUpdateNotificationClick = __bind(this.onUpdateNotificationClick, this);
        this.onLessonOpened = __bind(this.onLessonOpened, this);
        _ref = UpdateView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      UpdateView.prototype.initialize = function(_arg) {
        this.conn = _arg.conn, this.mediator = _arg.mediator;
        return this._containerSlideTime = 80;
      };

      UpdateView.prototype.ui = {
        collabErrorMsg: '.collabErrorMsg',
        updateNotificationMsg: '.updateNotificationMsg',
        updateNotification: '.updateNotification'
      };

      UpdateView.prototype.events = {
        'click .updateNotification': 'onUpdateNotificationClick'
      };

      UpdateView.prototype.template = _.template(template);

      UpdateView.prototype.onShow = function() {
        vent.on('collab:update', this.onCollabUpdate);
        vent.on('lesson:opened', this.onLessonOpened);
        this.conn.on('collab:ready', this.onEnableCollab);
        return this.conn.on('collab:close', this.onDisableCollab);
      };

      UpdateView.prototype.onClose = function() {
        vent.off('collab:update', this.onCollabUpdate);
        vent.off('lesson:opened', this.onLessonOpened);
        this.conn.off('collab:ready', this.onEnableCollab);
        return this.conn.off('collab:close', this.onDisableCollab);
      };

      UpdateView.prototype.onLessonOpened = function(lesson) {
        return this.lesson = lesson;
      };

      UpdateView.prototype.onUpdateNotificationClick = function() {
        this.conn.resetUpdates();
        this.message('Fetching Updates...');
        return this.lesson.fetch().done(this.onCourseRefetchSuccess).fail(this.onCourseRefetchFail);
      };

      UpdateView.prototype.onCourseRefetchSuccess = function() {
        if (this.conn.hasUpdates()) {
          return this.onCollabUpdate();
        } else {
          return this.slideUp();
        }
      };

      UpdateView.prototype.onCourseRefetchFail = function() {
        return this.message('Failed to update lesson, please try again!');
      };

      UpdateView.prototype.onCollabUpdate = function() {
        var msg;
        msg = this.conn.updateCount() === 1 ? "See new update" : "See " + (this.conn.updateCount()) + " new updates";
        if (this.conn.hasGadgetUpdates()) {
          msg += '; unlock updated gadgets';
        }
        this.message(msg);
        return this.slideDown();
      };

      UpdateView.prototype.slideUp = function() {
        return this.ui.updateNotification.slideUp(this._containerSlideTime);
      };

      UpdateView.prototype.slideDown = function() {
        return this.ui.updateNotification.slideDown(this._containerSlideTime);
      };

      UpdateView.prototype.message = function(msg) {
        return this.ui.updateNotificationMsg.text(msg);
      };

      return UpdateView;

    })(Marionette.Layout);
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('collections/gadget_locks',['backbone', 'models/gadget_lock'], function(Backbone, GadgetLock) {
    var GadgetLocks, _ref;
    return GadgetLocks = (function(_super) {
      __extends(GadgetLocks, _super);

      function GadgetLocks() {
        _ref = GadgetLocks.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GadgetLocks.prototype.model = GadgetLock;

      return GadgetLocks;

    })(Backbone.Collection);
  });

}).call(this);


define('text!styles/collab-client-bundle.css',[],function () { return '.collab-lock-icon{font-size:24px;text-indent:7px;margin-top:5px;color:#e4e3e0}.collab-lock-avatar{width:32px;height:32px;position:absolute;right:5px;top:5px}.comments-container{display:none;}.comments-container.comments-visible .comments-box{display:block}.comments-container.comments-visible .fv-bubble{transform:none;filter:none}.comments-container.comments-visible .commentAuthor{font-family:\'AvenirNextLTPro-Regular\',\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-weight:bold}.comments-toolbar{position:absolute;list-style-type:none;padding:0;margin:0;top:0;color:#454442;text-align:left;right:-30px;color:#c7c3be;width:16px;}.comments-toolbar button{margin:7px}.comments-toolbar textarea{resize:none;margin:7px;color:#454442;font:12px \'AvenirNextLTPro-Regular\',\'Helvetica Neue\',Helvetica,Arial,sans-serif;width:196px;box-sizing:border-box}.comments-toolbar .deleted_comment{font-style:italic;color:#c7c3be}.comments-toolbar .actions{height:22px}.comments-toolbar .comment{color:#454442;font:12px \'AvenirNextLTPro-Regular\',\'Helvetica Neue\',Helvetica,Arial,sans-serif;border-width:1px;border-bottom:1px #e4e3e0 solid;padding:7px;line-height:18px;position:relative;}.comments-toolbar .comment:first-child{margin-top:-8px}.comments-toolbar .comment .delete-overlay{position:absolute;top:0;left:0;width:100%;height:100%;text-align:center;background:rgba(242,241,237,0.9);display:none;z-index:100;}.comments-toolbar .comment .delete-overlay .delete-content{position:absolute;top:50%;margin-top:-35px}.comments-toolbar .comment .delete-overlay button{display:inline-block;width:80px}.comments-toolbar .comment.compacted .comment-body{overflow:hidden;max-height:142px;position:relative;z-index:1}.comments-toolbar .comment.compacted .comment-actions{position:relative;z-index:2;box-shadow:0 -15px 10px #fff;}.comments-toolbar .comment.compacted .comment-actions .show-more{display:inline}.comments-toolbar .comment.expanded .comment-actions .show-less{display:inline}.comments-toolbar .comment img{width:40px;height:40px}.comments-toolbar .comment .commentInfo{display:inline-block;line-height:.2;}.comments-toolbar .comment .commentInfo .commentDate{color:#c7c3be}.comments-toolbar .comment .comment-actions{height:16px;position:relative;}.comments-toolbar .comment .comment-actions .comment-action{color:#c7c3be;text-decoration:underline;cursor:pointer}.comments-toolbar .comment .show-less,.comments-toolbar .comment .show-more{display:none}.comments-toolbar .comments{position:absolute;}.comments-toolbar .comments .errorMsg{text-align:center;color:#454442;font:12px \'AvenirNextLTPro-Regular\',\'Helvetica Neue\',Helvetica,Arial,sans-serif;margin:5px;padding:5px 0;background-color:rgba(242,241,237,0.9)}.comments-toolbar .comments-toggle{cursor:pointer;height:24px;}.comments-toolbar .comments-toggle:hover .fv-bubble{color:#c7c3be}.comments-toolbar .fv-bubble{margin-left:-5px;margin-top:-5px;font-size:24px;color:#eae9e7;transform:scaleX(-1);filter:FlipH}.comments-toolbar .icon-inner-text{margin-top:1px;margin-left:-5px;font:11px \'AvenirNextLTPro-Regular\',\'Helvetica Neue\',Helvetica,Arial,sans-serif;color:#524e47;font-weight:bold;display:table-cell;vertical-align:middle}.comments-toolbar .comments-box{display:none;position:absolute;box-shadow:0 1px 12px #c7c3be;padding:0;background-color:#fff;z-index:1002;margin-left:20px;width:210px;}.comments-toolbar .comments-box.visible{display:block}.comments-toolbar .comments-box.above{bottom:0}.comments-toolbar .comments-box p{margin:5px}.comments-toolbar .comments-box .comment-body{margin-left:0}.comments-toolbar .comments-box .inner-comments{max-height:225px;height:auto;overflow:auto;margin-top:8px}.comments-toolbar .comments-box button{padding:1px 0;line-height:28px;width:95px;}.comments-toolbar .comments-box button.cancel-button{margin-right:0}.comments-toolbar .comments-box button.submit-button{margin-left:0}.updateNotificationContainer{position:fixed;top:0;width:100%;max-width:758px;left:291px;z-index:5010;margin:0 auto;text-align:center;cursor:pointer;}.updateNotificationContainer .updateNotification{display:none;cursor:pointer;color:#486b6d;padding:10px 0;background-color:rgba(242,241,237,0.9)}.updateNotificationContainer .updateNotificationMsg{margin-left:10px}\n';});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('collab',['underscore', 'backbone', 'handlers/users', 'handlers/locks', 'handlers/comments', 'handlers/updates', 'views/contributors', 'views/comments', 'views/lock', 'views/update', 'vent', 'models/gadget_comment', 'models/gadget_lock', 'collections/gadget_comments', 'collections/collapsible_gadget_comments', 'collections/gadget_locks', 'text!styles/collab-client-bundle.css'], function(_, Backbone, UsersHandler, LocksHandler, CommentsHandler, UpdatesHandler, ContributorsView, GadgetCommentsView, GadgetLockView, UpdateView, vent, GadgetComment, GadgetLock, GadgetComments, CollapsibleGadgetComments, GadgetLocks, collabStyle) {
    var Collab;
    Collab = (function() {
      function Collab() {
        this._populatePlayerUpdate = __bind(this._populatePlayerUpdate, this);
        this._populatePlayerContrib = __bind(this._populatePlayerContrib, this);
        this.phoneHome = __bind(this.phoneHome, this);
        this.onMessage = __bind(this.onMessage, this);
        this.onClose = __bind(this.onClose, this);
        this.onOpen = __bind(this.onOpen, this);
        this.onError = __bind(this.onError, this);
        this.connect = __bind(this.connect, this);
      }

      _.extend(Collab.prototype, Backbone.Events);

      Collab.prototype.GadgetComment = GadgetComment;

      Collab.prototype.GadgetComments = GadgetComments;

      Collab.prototype.CollapsibleGadgetComments = CollapsibleGadgetComments;

      Collab.prototype.GadgetLock = GadgetLock;

      Collab.prototype.GadgetLocks = GadgetLocks;

      Collab.prototype.phoneHomeEveryMs = 60 * 1000;

      Collab.prototype.tryConnectingEveryMs = 2 * 1000;

      Collab.prototype.lastActivity = new Date;

      Collab.prototype.updates = [];

      Collab.prototype.init = function(mediator, options) {
        this.mediator = mediator;
        this.courseId = options.courseId, this.collabUrl = options.collabUrl, this.site = options.site;
        this.sessionId = options.api.sessionId;
        this.connect();
        this.resetLastActivity();
        this._injectStyles();
        new UsersHandler(this);
        new LocksHandler(this);
        new CommentsHandler(this);
        new UpdatesHandler(this);
        this.contributorsView = new ContributorsView({
          mediator: this.mediator,
          conn: this,
          site: this.site
        });
        this.updateBarView = new UpdateView({
          mediator: this.mediator,
          conn: this
        });
        this.enabled = false;
        this.subscribed = false;
        this.activeLocks = new this.GadgetLocks;
        this.initializedGadgetViewContainers = [];
        this.mediator.on('lesson:opened', this.onLessonOpened, this);
        this.mediator.on('lesson:closed', this.onLessonClosed, this);
        this.mediator.on('gadget:rendered', this.onGadgetRendered, this);
        this.mediator.on('player:authorSideBar:ready', this._populatePlayerContrib, this);
        return this.mediator.on('player:course:ready', this._populatePlayerUpdate, this);
      };

      Collab.prototype.onLessonOpened = function(lesson) {
        var _this = this;
        if (this.enabled) {
          this.subscribe(lesson.id);
          return vent.trigger('lesson:opened', lesson);
        } else {
          return this.once('ws:open', function() {
            _this.subscribe(lesson.id);
            return vent.trigger('lesson:opened', lesson);
          });
        }
      };

      Collab.prototype.onLessonClosed = function(lesson) {
        return this.unsubscribe(lesson.id);
      };

      Collab.prototype.connect = function() {
        this.socket = new WebSocket(this.collabUrl);
        this.socket.onopen = this.onOpen;
        this.socket.onclose = this.onClose;
        this.socket.onerror = this.onError;
        return this.socket.onmessage = this.onMessage;
      };

      Collab.prototype.onError = function(error) {
        var message;
        message = error.channel ? "error connecting to course " + error.channel.courseId + " lesson " + error.channel.courseId : "error connecting to " + this.collabUrl;
        return this.trigger('ws:error', message, error);
      };

      Collab.prototype.onOpen = function() {
        this.cancelRetryConnect();
        this.phoneHomePeriodically();
        this.enabled = true;
        if (this.lessonId) {
          this.subscribe(this.lessonId);
        }
        this.trigger('ws:open');
        return this.mediator.trigger('course:collab:open');
      };

      Collab.prototype.subscribe = function(lessonId) {
        this.lessonId = lessonId;
        if (!this.lessonId) {
          throw new Error('No lesson ID to subscribe to');
        }
        return this.triggerEvent('subscribe', {
          sessionId: this.sessionId
        });
      };

      Collab.prototype.unsubscribe = function() {
        this.triggerEvent('unsubscribe');
        return delete this.lessonId;
      };

      Collab.prototype.onClose = function() {
        clearTimeout(this.phoneHomeId);
        this.scheduleRetryConnect();
        this.enabled = false;
        this.subscribed = false;
        this.trigger('ws:close');
        return this.mediator.trigger('course:collab:close');
      };

      Collab.prototype.resetLastActivity = function() {
        return this.lastActivity = new Date().getTime();
      };

      Collab.prototype.onMessage = function(rawPayload) {
        var data, payload;
        this.subscribed = true;
        payload = JSON.parse(rawPayload.data);
        data = this._dataToModels(payload);
        return this.trigger(payload.name, data);
      };

      Collab.prototype.scheduleRetryConnect = function() {
        return this.retryId = setTimeout(this.connect, this.tryConnectingEveryMs);
      };

      Collab.prototype.cancelRetryConnect = function() {
        if (this.retryId) {
          return clearTimeout(this.retryId);
        }
      };

      Collab.prototype.phoneHome = function() {
        var now;
        now = new Date().getTime();
        return this.triggerEvent('ping', {
          idleMs: now - this.lastActivity
        });
      };

      Collab.prototype.phoneHomePeriodically = _.once(function() {
        return this.phoneHomeId = setInterval(this.phoneHome, this.phoneHomeEveryMs);
      });

      Collab.prototype.onGadgetRendered = function(gadget) {
        return this._populatePlayerCommentsLocks(gadget);
      };

      Collab.prototype.triggerEvent = function(name, data) {
        var channel;
        channel = {
          lessonId: this.lessonId,
          courseId: this.courseId
        };
        return this.socket.send(JSON.stringify({
          name: name,
          channel: channel,
          data: data
        }));
      };

      Collab.prototype.hasUpdates = function() {
        return !!this.updates.length;
      };

      Collab.prototype.updateCount = function() {
        return this.updates.length;
      };

      Collab.prototype.resetUpdates = function() {
        return this.updates = [];
      };

      Collab.prototype.hasGadgetUpdates = function() {
        return _.any(this.updates, function(update) {
          return _.has(update, 'gadgetId');
        });
      };

      Collab.prototype.gadgetHasUpdates = function(gadgetId) {
        return !!_.findWhere(this.updates, {
          gadgetId: gadgetId
        });
      };

      Collab.prototype._dataToModels = function(payload) {
        var action, data, key, modelMap, modelName, _ref;
        modelMap = {
          comment: 'GadgetComment',
          comments: 'GadgetComments',
          lock: 'GadgetLock',
          locks: 'GadgetLocks'
        };
        data = this._dereferenceEventData(payload);
        _ref = payload.name.split(':'), key = _ref[0], action = _ref[1];
        modelName = modelMap[key];
        if (modelName && action !== 'delete') {
          return new vs.collab[modelName](data);
        } else {
          return data;
        }
      };

      Collab.prototype._dereferenceEventData = function(payload) {
        var key;
        key = payload.name.split(':').shift();
        return payload.data[key];
      };

      Collab.prototype._generateCommentsLocks = function(gadget) {
        var commentsView, lock, lockView, _ref;
        commentsView = new GadgetCommentsView({
          model: gadget,
          mediator: this.mediator,
          site: this.site,
          conn: this
        });
        lockView = new GadgetLockView({
          model: gadget,
          mediator: this.mediator,
          site: this.site,
          conn: this
        });
        if (lock = (_ref = this.activeLocks) != null ? _ref.findWhere({
          gadgetId: gadget.id
        }) : void 0) {
          lockView.updateLock(lock);
        }
        return {
          lockView: lockView,
          commentsView: commentsView
        };
      };

      Collab.prototype._populatePlayerCommentsLocks = function(gadget) {
        var commentsView, lockView, _ref;
        _ref = this._generateCommentsLocks(gadget), lockView = _ref.lockView, commentsView = _ref.commentsView;
        this.mediator.trigger('plugin:populate:gadgetCommentsRegion', commentsView);
        return this.mediator.trigger('plugin:populate:gadgetLockRegion', lockView);
      };

      Collab.prototype._populatePlayerContrib = function() {
        return this.mediator.trigger('plugin:populate:contributorsRegion', this.contributorsView);
      };

      Collab.prototype._populatePlayerUpdate = function() {
        return this.mediator.trigger('plugin:populate:updateBar', this.updateBarView);
      };

      Collab.prototype._injectStyles = function() {
        var style;
        style = document.createElement('style');
        style.textContent = collabStyle;
        return document.getElementsByTagName('head')[0].appendChild(style);
      };

      return Collab;

    })();
    return new Collab();
  });

}).call(this);

  define('underscore', [], function(){
    return window._;
  });

  define('backbone', [], function(){
    return window.Backbone;
  });

  define('backbone.marionette', [], function(){
    return window.Backbone.Marionette;
  });

  return require('collab');
}));