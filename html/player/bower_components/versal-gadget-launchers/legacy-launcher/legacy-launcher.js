require(['cdn.underscore', 'cdn.backbone', 'cdn.jquery'], function(_, Backbone, $) {

  // This is the interface to Versal Player.
  // It is passed as options.player to the gadget constructor.
  // Gadget can use this object to listen to player events,
  // notify player about events within a gadget and
  // utilize APIs, provided by the player, like "selectAsset" or "assetUrl"
  var LegacyPlayerInterface = function(options) {
    this.gadgetBaseUrl = options.gadgetBaseUrl;
    this._assetUrlTemplate = _.template(options.assetUrlTemplate);
  };
  _.extend(LegacyPlayerInterface.prototype, Backbone.Events);
  LegacyPlayerInterface.prototype.selectAsset = function(type) {
    var dfd = $.Deferred();
    this.trigger('asset:select', {
      type: type,
      success: dfd.resolve
    });
    return dfd;
  };
  LegacyPlayerInterface.prototype.assetPath = function(assetId) {
    return this._assetUrlTemplate({
      id: assetId
    });
  };
  // TODO: Deprecate as soon as all gadgets are migrated to project.path
  LegacyPlayerInterface.prototype.assetUrl = function(assetPath) {
    return this.gadgetBaseUrl + '/' + assetPath;
  };

  // Immediately resolve the various callbacks from `Backbone.sync` successfully
  var resolveSyncCallbacks = function(model, opts) {
    // Hack in `success` callback used by SAT gadgets
    if (opts && _.isFunction(opts.success)) {
      opts.success(model, model.toJSON(), opts);
    }

    var dfd = $.Deferred();

    // Hack in deprecated jqXHR methods used by SAT gadgets
    dfd.success = _.bind(dfd.done, dfd);
    dfd.error = _.bind(dfd.fail, dfd);

    // SAT critical-reading gadget needs a `sync` after firing a `fetch`
    dfd.done(function() {
      model.trigger('sync');
    });

    return dfd.resolve(model);
  };
  var LocalModel = Backbone.Model.extend({
    save: function(attrs, opts) {
      this.set.apply(this, arguments);

      // NOTE: this serves the purposes of making sure
      // attributes are changed even when @set is called
      // with `silent: true` before @save
      this.trigger('gadgetTriggeredSave', this);

      return resolveSyncCallbacks(this, opts);
    },

    fetch: function(opts) {
      return resolveSyncCallbacks(this, opts);
    }
  });

  var findDeepChangedAttributes = function(newObj, oldObj) {
    newObjClone = _.clone(newObj);
    for (var key in newObjClone) {
      if (_.isEqual(newObjClone[key], oldObj[key])) delete newObjClone[key];
    }
    return newObjClone;
  };

  var prototype = Object.create(HTMLElement.prototype, {

    // These attributes will be set before this element is attached.
    gadgetBaseUrl: {
      get: function() {
        return this.getAttribute("gadget-base-url") || "";
      }
    },
    gadgetCssClassName: {
      get: function() {
        return this.getAttribute("gadget-css-class-name") || "";
      }
    },
    editable: {
      get: function() {
        return this.getAttribute("editable") == 'true';
      }
    },
    editingAllowed: {
      get: function() {
        return this.getAttribute("editing-allowed") == 'true';
      }
    },
    shouldFireCloseEventOnDetached: {
      get: function() {
        return this.hasAttribute("should-fire-close-event-on-detached");
      }
    },
    config: {
      get: function() {
        return this._readAttributeAsJson("data-config");
      }
    },
    userstate: {
      get: function() {
        return this._readAttributeAsJson("data-userstate");
      }
    },
    env: {
      get: function() {
        return this._readAttributeAsJson("data-environment");
      }
    }
  });
  prototype._readAttributeAsJson = function(name) {
    if (!this.hasAttribute(name)) {
      return {};
    }
    return JSON.parse(this.getAttribute(name));
  };
  prototype.createdCallback = function() {
    this.$el = $('<div>');

    this._config = new LocalModel();
    // NOTE this serves the purpose of making sure attributes are saved
    // when @set is called with 'silent: true' before @save
    this._config.on('gadgetTriggeredSave', this._onGadgetTriggeredSave, this);
    this._config.on('change', this._onGadgetTriggeredSave, this);

    this._userstate = new LocalModel();
    this._userstate.gadget = new Backbone.Model({
      id: 1337
    });
    this._userstate.on('change', (function(model, opts) {
      if (opts.source !== 'player') {
        this._fireCustomEvent('setLearnerState', findDeepChangedAttributes(model.toJSON(), this.userstate));
      }
    }).bind(this));

    this._propertySheetSchema = new LocalModel();
    this._propertySheetSchema.on('change', (function(model, opts) {
      this._fireCustomEvent('setPropertySheetAttributes', model.toJSON());
    }).bind(this));
  };
  prototype._loadGadgetCssIfNeeded = function(gadgetBaseUrl, gadgetCssClassName) {
    // Each CSS element will have a unique ID for each gadget class: id=gadgetCssClassName
    // Inject CSS only if we do not yet have it in DOM
    if (document.getElementById(gadgetCssClassName)) {
      return;
    }
    $('<link rel="stylesheet" type="text/css" />')
      .attr('id', gadgetCssClassName)
      .attr('href', gadgetBaseUrl + '/gadget.css')
      .appendTo('head');
    // TODO: some legacy gadgets have no CSS file, and then the gadget project has an attribute 'noCSS'. We might need to check for that. Pass an empty gagdetCssClassName in that case?
  };
  prototype._loadGadgetJsIfNeeded = function(gadgetBaseUrl) {
    if (this._startedLoadingJavascript) {
      return;
    }
    this._startedLoadingJavascript = true;

    return require([gadgetBaseUrl + '/gadget.js'], (function(gadgetConstructor) {
      this.appendChild(this.$el.get(0));
      this._launch(gadgetConstructor);
      this._fireCustomEvent('rendered');
    }).bind(this), (function(err) {
      this._fireError({
        message: err.message
      });
    }).bind(this));
  };
  prototype._loadGadgetCode = function(gadgetBaseUrl) {
    this._loadGadgetCssIfNeeded(gadgetBaseUrl, this.gadgetCssClassName);
    this._loadGadgetJsIfNeeded(gadgetBaseUrl);
  };
  prototype._gadgetOptions = function() {
    var assetUrlTemplate = (this.env && this.env.assetUrlTemplate) || '';
    this.playerInterface = new LegacyPlayerInterface({
      assetUrlTemplate: assetUrlTemplate,
      gadgetBaseUrl: this.gadgetBaseUrl
    });
    this.playerInterface.isEditable = this.editingAllowed;
    this.playerInterface.on('configEmpty', (function() {
      this._fireCustomEvent('setEmpty');
    }).bind(this));
    this.playerInterface.on('track', (function(ev, data) {
      this._fireCustomEvent('track', _.extend({
        '@type': ev
      }, data), {
        bubbles: true
      });
    }).bind(this));
    this.playerInterface.on('asset:select', (function(event) {
      this._fireCustomEvent('selectAsset', event);
    }).bind(this));
    this.playerInterface.on('blocking:changed', (function() {
      this._fireCustomEvent('changeBlocking');
    }).bind(this));

    return {
      player: this.playerInterface,
      facade: this.playerInterface,
      project: {
        path: (function(url) {
          return this.gadgetBaseUrl + '/' + url;
        }).bind(this)
      },

      $el: this.$el,
      el: this.$el.get(0),
      config: this._config,
      userState: this._userstate,

      // Only for Survey gadget by Tekliner, not actually used there
      // any more, since way of getting aggregate data has changed
      // since https://github.com/Versal/tekliner-gadgets/pull/404
      userStates: new Backbone.Collection(),

      model: this._config,

      propertySheetSchema: this._propertySheetSchema,
      children: this._containersInterface,
      containers: this._containersInterface
    };
  };
  prototype._launch = function(gadgetConstructor) {
    try {
      var instance = new gadgetConstructor(this._gadgetOptions());

      // Force a (faked) `sync` event to appease SAT gadgets
      this._userstate.fetch();

      this.playerInterface.on('broadcast:send', this._broadcastEvent.bind(this));

      this.playerInterface.trigger('domReady');
      this.attributeChangedCallback('editable');
    } catch (err) {
      this._fireError({
        message: 'Error when loading: ' + err,
        stacktrace: err.stack
      });
    }
  };
  prototype._broadcastEvent = function(evt){
    var _this = this;
    var otherLegacyLaunchers = document.querySelectorAll('versal-legacy-launcher');
    Array.prototype.forEach.call(otherLegacyLaunchers, function(other){
      if(other == _this) return;
      if(other.playerInterface) {
        other.playerInterface.trigger('broadcast:receive', evt);
      }
    })
  };
  prototype.attachedCallback = function() {
    this.attributeChangedCallback('data-config');
    this.attributeChangedCallback('data-userstate');
    this.$el.addClass(this.gadgetCssClassName);

    if (this.gadgetBaseUrl) {
      this._loadGadgetCode(this.gadgetBaseUrl);
    } else {
      console.warn('Empty gadgetBaseUrl for ' + this.gadgetCssClassName);
    }
  };
  prototype.detachedCallback = function() {
    this.playerInterface.off('broadcast:send', this._broadcastEvent.bind(this));

    if (this.shouldFireCloseEventOnDetached) {
      this._passEvent('close');
    }
  };
  prototype.attributeChangedCallback = function(name) {
    switch (name) {
      case 'editable':
        this._passEvent('toggleEdit', this.editable);
        break;
      case 'data-config':
        this._config.clear({silent: true});
        this._config.set(this.config, {
          source: 'player'
        });
        break;
      case 'data-userstate':
        this._userstate.clear({silent: true});
        this._userstate.set(this.userstate, {
          source: 'player'
        });

        // probably only for quiz gadget
        // see https://github.com/Versal/player/issues/1579#issuecomment-38737311
        this._userstate.trigger('sync');
        break;
    }
  };
  prototype.setLegacyContainers = function(_containersInterface) {
    this._containersInterface = _containersInterface;
  };
  prototype._onGadgetTriggeredSave = function(model, opts) {
    opts = opts || {};
    if (opts.source !== 'player') {
      if (this.editingAllowed) {
        this._fireCustomEvent('setAttributes', findDeepChangedAttributes(model.toJSON(), this.config));
      }
    }
  };
  prototype._fireError = function(data) {
    this._fireCustomEvent('error', data, {bubbles: true});
  };
  prototype._passEvent = function() {
    try {
      // playerInterface might not be initialised yet
      if (this.playerInterface) {
        this.playerInterface.trigger.apply(this.playerInterface, arguments);
      }
    } catch (err) {
      this._fireError({
        message: "Error when passing event '" + arguments[0] + "': " + err,
        stacktrace: err.stack
      });
    }
  };
  prototype._fireCustomEvent = function(eventName, data, options) {
    options = options || {};
    var evt = new CustomEvent(eventName, {
      detail: data,
      bubbles: options.bubbles || false
    });
    this.dispatchEvent(evt);
  };

  document.registerElement("versal-legacy-launcher", {
    prototype: prototype
  });

}, function(err) {
  console.log('Cannot load versal-legacy-launcher, error: ', err);
});
