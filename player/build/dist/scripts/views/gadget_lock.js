(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'app/mediator', 'text!templates/gadget_lock.html'], function(Marionette, mediator, template) {
    var GadgetLockView;
    return GadgetLockView = (function(_super) {

      __extends(GadgetLockView, _super);

      function GadgetLockView() {
        return GadgetLockView.__super__.constructor.apply(this, arguments);
      }

      GadgetLockView.prototype.template = _.template(template);

      GadgetLockView.prototype.initialize = function(options) {
        this.gadget = this.model;
        mediator.on('lock:lock', this.onLockLocked, this);
        return mediator.on('lock:unlock', this.onLockUnlocked, this);
      };

      GadgetLockView.prototype.ui = {
        'editor': '.js-lock',
        'lock': '.icon-lock'
      };

      GadgetLockView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          isLocked: function() {
            return !!_this.gadget.lock;
          },
          profileImage: function() {
            var image, representations, _ref;
            representations = (_ref = _this.gadget.lock.get('user').image) != null ? _ref.representations : void 0;
            if (representations) {
              image = _.find(representations, function(representation) {
                return representation.scale === "140x140";
              });
              return image.location;
            } else {
              return "../assets/img/profile-retina.jpg";
            }
          }
        };
      };

      GadgetLockView.prototype.onLockLocked = function(lock) {
        if (lock.get('gadgetId') === this.gadget.id) {
          this.gadget.lock = lock;
          this.gadget.trigger('unlock');
          return this.render();
        }
      };

      GadgetLockView.prototype.onLockUnlocked = function(lock) {
        var gadgetId;
        gadgetId = lock.get('gadgetId');
        if (this.gadget.lock && gadgetId === this.gadget.id) {
          delete this.gadget.lock;
          this.gadget.trigger('lock');
          return this.render();
        }
      };

      return GadgetLockView;

    })(Marionette.ItemView);
  });

}).call(this);
