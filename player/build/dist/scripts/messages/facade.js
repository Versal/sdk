(function() {
  var __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(['cdn.backbone', 'app/mediator'], function(Backbone, mediator) {
    var Facade, locals;
    locals = ['change', 'configure', 'configChange', 'configEmpty', 'doneEditing', 'domReady', 'domRemove', 'save', 'toggleEdit', 'registerPropertySheet', 'render', 'cancelEditing'];
    return Facade = (function() {

      function Facade(options) {
        var _this = this;
        this._model = options.model;
        this._gadgetId = this._model.cid;
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

      Facade.prototype.assetUrl = function(file) {
        var files;
        files = this._model.gadgetProject.get('files');
        return files[file];
      };

      return Facade;

    })();
  });

}).call(this);
