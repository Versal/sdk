/*!
 * js-collab v0.0.5
 * lovingly baked from 492a252 on 09. October 2013
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

define('handler',['require','exports','module'],function (require, exports, module) {(function() {
  var Handler;

  Handler = (function() {
    function Handler(conn) {
      this.conn = conn;
      this.mediator = this.conn.mediator;
      vs.collab.on('ws:open', this.listenToMediator, this);
      vs.collab.on('ws:close', this.stopListeningToMediator, this);
    }

    Handler.prototype.listenToMediator = function() {
      var handler, name, _ref, _results;
      if (!this.events) {
        return;
      }
      _ref = this.events;
      _results = [];
      for (name in _ref) {
        handler = _ref[name];
        _results.push(this.mediator.on(name, this[handler], this));
      }
      return _results;
    };

    Handler.prototype.stopListeningToMediator = function() {
      var handler, name, _ref, _results;
      if (!this.events) {
        return;
      }
      _ref = this.events;
      _results = [];
      for (name in _ref) {
        handler = _ref[name];
        _results.push(this.mediator.off(name, this[handler], this));
      }
      return _results;
    };

    return Handler;

  })();

  module.exports = Handler;

}).call(this);

});

define('handlers/users',['require','exports','module','underscore','../handler'],function (require, exports, module) {(function() {
  var Handler, UsersHandler, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Handler = require('../handler');

  UsersHandler = (function(_super) {
    __extends(UsersHandler, _super);

    function UsersHandler() {
      _ref = UsersHandler.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    UsersHandler.prototype.events = {
      'lesson:opened': 'join',
      'lesson:closed': 'leave',
      'user:me': 'onUserIdentity',
      'gadget:activity': 'onGadgetActivity'
    };

    UsersHandler.prototype.join = function(lesson) {
      this.conn.lessonId = lesson.id;
      return this.conn.subscribe();
    };

    UsersHandler.prototype.leave = function() {
      this.conn.triggerEvent('unsubscribe');
      return delete this.conn.lessonId;
    };

    UsersHandler.prototype.onUserIdentity = function(user) {
      return this.conn.me = user;
    };

    UsersHandler.prototype.onGadgetActivity = function() {
      return this.conn.resetLastActivity();
    };

    return UsersHandler;

  })(Handler);

  module.exports = UsersHandler;

}).call(this);

});

define('models/gadget_lock',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetLock, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  GadgetLock = (function(_super) {
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

  module.exports = GadgetLock;

}).call(this);

});

define('handlers/locks',['require','exports','module','underscore','../handler','../models/gadget_lock'],function (require, exports, module) {(function() {
  var GadgetLock, Handler, LocksHandler, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Handler = require('../handler');

  GadgetLock = require('../models/gadget_lock');

  LocksHandler = (function(_super) {
    __extends(LocksHandler, _super);

    function LocksHandler() {
      _ref = LocksHandler.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LocksHandler.prototype.events = {
      'locks:list': 'onLocksList',
      'lock:locked': 'onLockLocked',
      'lock:unlocked': 'onLockUnlocked'
    };

    LocksHandler.prototype.onLocksList = function(locks) {
      var _this = this;
      return locks.each(function(lock) {
        return _this.mediator.trigger('lock:lock', lock);
      });
    };

    LocksHandler.prototype.onLockLocked = function(gadget) {
      var lock;
      this.conn.triggerEvent('lock:lock', {
        gadgetId: gadget.id
      });
      lock = new GadgetLock({
        gadgetId: gadget.id,
        user: this.conn.me,
        editable: true
      });
      return this.mediator.trigger('lock:lock', lock);
    };

    LocksHandler.prototype.onLockUnlocked = function(gadget) {
      var lock;
      this.conn.triggerEvent('lock:unlock', {
        gadgetId: gadget.id
      });
      lock = new GadgetLock({
        gadgetId: gadget.id
      });
      return this.mediator.trigger('lock:unlock', lock);
    };

    return LocksHandler;

  })(Handler);

  module.exports = LocksHandler;

}).call(this);

});

define('handlers/comments',['require','exports','module','underscore','../handler'],function (require, exports, module) {(function() {
  var CommentsHandler, Handler, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Handler = require('../handler');

  CommentsHandler = (function(_super) {
    __extends(CommentsHandler, _super);

    function CommentsHandler() {
      _ref = CommentsHandler.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CommentsHandler.prototype.events = {
      'comments:list': 'onCommentsList',
      'comment:added': 'onCommentAdded',
      'comment:deleted': 'onCommentDeleted'
    };

    CommentsHandler.prototype.onCommentsList = function(comments) {
      var _this = this;
      return this._personalizeCollection(comments).each(function(comment) {
        return _this.mediator.trigger('comment:add', comment);
      });
    };

    CommentsHandler.prototype.onCommentAdded = function(comment) {
      this.conn.triggerEvent('comment:add', {
        gadgetId: comment.get('gadgetId'),
        body: comment.get('body')
      });
      comment.set({
        user: this.conn.me
      });
      return this.mediator.trigger('comment:add', comment);
    };

    CommentsHandler.prototype.onCommentDeleted = function(comment) {
      this.conn.triggerEvent('comment:delete', {
        gadgetId: comment.get('gadgetId'),
        commentId: comment.id
      });
      comment.deleted = true;
      return this.mediator.trigger('comment:delete', comment);
    };

    CommentsHandler.prototype._personalizeCollection = function(collection) {
      var _this = this;
      collection.each(function(item) {
        if (item.get('user').id === _this.conn.me.id) {
          return item.set({
            editable: true
          });
        }
      });
      return collection;
    };

    return CommentsHandler;

  })(Handler);

  module.exports = CommentsHandler;

}).call(this);

});

define('handlers/updates',['require','exports','module','../handler'],function (require, exports, module) {(function() {
  var Handler, UpdatesHandler, updateEvents, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Handler = require('../handler');

  updateEvents = ['course:changed', 'lesson:changed', 'lesson:gadget:added', 'lesson:gadget:deleted', 'lesson:gadget:moved', 'gadget:changed'];

  UpdatesHandler = (function(_super) {
    __extends(UpdatesHandler, _super);

    function UpdatesHandler() {
      _ref = UpdatesHandler.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    UpdatesHandler.prototype.events = _.object(_.map(updateEvents, function(k) {
      return [k, 'onCourseUpdated'];
    }));

    UpdatesHandler.prototype.onCourseUpdated = function() {
      return this.conn.triggerEvent('course:update');
    };

    return UpdatesHandler;

  })(Handler);

  module.exports = UpdatesHandler;

}).call(this);

});

define('connection',['require','exports','module','underscore','backbone','./handlers/users','./handlers/locks','./handlers/comments','./handlers/updates'],function (require, exports, module) {(function() {
  var Backbone, CommentsHandler, Connection, LocksHandler, UpdatesHandler, UsersHandler, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore');

  Backbone = require('backbone');

  UsersHandler = require('./handlers/users');

  LocksHandler = require('./handlers/locks');

  CommentsHandler = require('./handlers/comments');

  UpdatesHandler = require('./handlers/updates');

  Connection = (function() {
    _.extend(Connection.prototype, Backbone.Events);

    Connection.prototype.phoneHomeEveryMs = 60 * 1000;

    Connection.prototype.tryConnectingEveryMs = 2 * 1000;

    Connection.prototype.lastActivity = new Date;

    function Connection(collab, mediator, options) {
      this.collab = collab;
      this.mediator = mediator;
      this.phoneHome = __bind(this.phoneHome, this);
      this.onMessage = __bind(this.onMessage, this);
      this.onClose = __bind(this.onClose, this);
      this.onOpen = __bind(this.onOpen, this);
      this.onError = __bind(this.onError, this);
      this.connect = __bind(this.connect, this);
      this.courseId = options.courseId;
      this.collabUrl = options.collabUrl;
      this.sessionId = options.api.sessionId;
      this.connect();
      this.resetLastActivity();
      new UsersHandler(this);
      new LocksHandler(this);
      new CommentsHandler(this);
      new UpdatesHandler(this);
    }

    Connection.prototype.connect = function() {
      this.socket = new WebSocket(this.collabUrl);
      this.socket.onopen = this.onOpen;
      this.socket.onclose = this.onClose;
      this.socket.onerror = this.onError;
      return this.socket.onmessage = this.onMessage;
    };

    Connection.prototype.onError = function(error) {
      var message;
      message = error.channel ? "error connecting to course " + error.channel.courseId + " lesson " + error.channel.courseId : "error connecting to " + this.collabUrl;
      return this.collab.trigger('ws:error', message, error);
    };

    Connection.prototype.onOpen = function() {
      if (this.lessonId) {
        this.subscribe();
      }
      this.cancelRetryConnect();
      this.phoneHomePeriodically();
      return this.collab.trigger('ws:open');
    };

    Connection.prototype.subscribe = function() {
      return this.triggerEvent('subscribe', {
        sessionId: this.sessionId
      });
    };

    Connection.prototype.onClose = function() {
      clearTimeout(this.phoneHomeId);
      this.scheduleRetryConnect();
      return this.collab.trigger('ws:close');
    };

    Connection.prototype.resetLastActivity = function() {
      return this.lastActivity = new Date().getTime();
    };

    Connection.prototype.onMessage = function(rawPayload) {
      var data, payload;
      payload = JSON.parse(rawPayload.data);
      data = this._dataToModels(payload);
      this.mediator.trigger(payload.name, data);
      if (payload.name === 'users:list') {
        return this.onReady();
      }
    };

    Connection.prototype.onReady = function() {
      return this.mediator.trigger('course:collab:ready');
    };

    Connection.prototype.scheduleRetryConnect = function() {
      return this.retryId = setTimeout(this.connect, this.tryConnectingEveryMs);
    };

    Connection.prototype.cancelRetryConnect = function() {
      if (this.retryId) {
        return clearTimeout(this.retryId);
      }
    };

    Connection.prototype.phoneHome = function() {
      var now;
      now = new Date().getTime();
      return this.triggerEvent('ping', {
        idleMs: now - this.lastActivity
      });
    };

    Connection.prototype.phoneHomePeriodically = _.once(function() {
      return this.phoneHomeId = setInterval(this.phoneHome, this.phoneHomeEveryMs);
    });

    Connection.prototype.triggerEvent = function(name, data) {
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

    Connection.prototype._dataToModels = function(payload) {
      var data, key, modelMap, modelName;
      modelMap = {
        comment: 'GadgetComment',
        comments: 'GadgetComments',
        lock: 'GadgetLock',
        locks: 'GadgetLocks'
      };
      data = this._dereferenceEventData(payload);
      key = payload.name.split(':').shift();
      modelName = modelMap[key];
      if (modelName) {
        return new vs.collab[modelName](data);
      } else {
        return data;
      }
    };

    Connection.prototype._dereferenceEventData = function(payload) {
      var key;
      key = payload.name.split(':').shift();
      return payload.data[key];
    };

    return Connection;

  })();

  module.exports = Connection;

}).call(this);

});

define('models/gadget_comment',['require','exports','module','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetComment, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone = require('backbone');

  GadgetComment = (function(_super) {
    __extends(GadgetComment, _super);

    function GadgetComment() {
      _ref = GadgetComment.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetComment.prototype.defaults = function() {
      return {
        createdAt: new Date,
        editable: false
      };
    };

    GadgetComment.prototype.isDeleted = function() {
      return !!this.get('deleted');
    };

    return GadgetComment;

  })(Backbone.Model);

  module.exports = GadgetComment;

}).call(this);

});

define('collections/gadget_comments',['require','exports','module','../models/gadget_comment','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetComment, GadgetComments, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  GadgetComment = require('../models/gadget_comment');

  Backbone = require('backbone');

  GadgetComments = (function(_super) {
    __extends(GadgetComments, _super);

    function GadgetComments() {
      _ref = GadgetComments.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetComments.prototype.model = GadgetComment;

    return GadgetComments;

  })(Backbone.Collection);

  module.exports = GadgetComments;

}).call(this);

});

define('collections/gadget_locks',['require','exports','module','../models/gadget_lock','backbone'],function (require, exports, module) {(function() {
  var Backbone, GadgetLock, GadgetLocks, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  GadgetLock = require('../models/gadget_lock');

  Backbone = require('backbone');

  GadgetLocks = (function(_super) {
    __extends(GadgetLocks, _super);

    function GadgetLocks() {
      _ref = GadgetLocks.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GadgetLocks.prototype.model = GadgetLock;

    return GadgetLocks;

  })(Backbone.Collection);

  module.exports = GadgetLocks;

}).call(this);

});

define('collab',['require','exports','module','backbone','underscore','./connection','./models/gadget_comment','./collections/gadget_comments','./models/gadget_lock','./collections/gadget_locks'],function (require, exports, module) {(function() {
  var Backbone, Connection, collab, _;

  Backbone = require('backbone');

  _ = require('underscore');

  Connection = require('./connection');

  module.exports = collab = {
    GadgetComment: require('./models/gadget_comment'),
    GadgetComments: require('./collections/gadget_comments'),
    GadgetLock: require('./models/gadget_lock'),
    GadgetLocks: require('./collections/gadget_locks'),
    init: function(options, mediator) {
      this.enabled = true;
      _.extend(this, Backbone.Events);
      return new Connection(this, mediator, options);
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

  return require('collab');
}));