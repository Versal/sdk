(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['plugins/vs.api'], function() {
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
        var gadgetType, name, result, username, version, _ref, _ref1;
        if (type === 'gadget/section' || type === 'versal/section@0.2.9') {
          type = 'versal/header@0.2.9';
        }
        result = this.find(function(gadget) {
          return gadget.type() === type || gadget.get('type') === type;
        });
        if (!result) {
          _ref = type.split('@'), gadgetType = _ref[0], version = _ref[1];
          _ref1 = gadgetType.split('/'), username = _ref1[0], name = _ref1[1];
          if (!version) {
            version = 'latest';
          }
          result = new vs.api.GadgetProject({
            username: username,
            name: name,
            version: version
          });
        }
        return result;
      };

      GadgetCatalogue.prototype.buildInstanceOfType = function(type, opts) {
        var gadget, instance;
        gadget = this.findGadgetByType(type);
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
