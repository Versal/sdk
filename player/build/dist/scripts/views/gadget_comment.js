(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'plugins/time_since', 'app/mediator', 'text!templates/gadget_comment.html'], function(Marionette, timeSince, mediator, template) {
    var GadgetCommentView;
    return GadgetCommentView = (function(_super) {

      __extends(GadgetCommentView, _super);

      function GadgetCommentView() {
        this.updateTimeSince = __bind(this.updateTimeSince, this);
        return GadgetCommentView.__super__.constructor.apply(this, arguments);
      }

      GadgetCommentView.prototype.updateTimeSinceEveryMs = 10 * 1000;

      GadgetCommentView.prototype.className = 'comment';

      GadgetCommentView.prototype.events = {
        'click .js-delete-comment': 'deleteComment'
      };

      GadgetCommentView.prototype.template = _.template(template);

      GadgetCommentView.prototype.ui = {
        createdAt: '.timestamp'
      };

      GadgetCommentView.prototype.initialize = function() {
        return this.comment = this.model;
      };

      GadgetCommentView.prototype.templateHelpers = function() {
        return {
          deleted: this.comment.isDeleted(),
          profileImage: this.profileImage
        };
      };

      GadgetCommentView.prototype.profileImage = function() {
        var image, _ref;
        if ((_ref = this.user) != null ? _ref.image : void 0) {
          image = _.find(this.user.image.representations, function(representation) {
            return representation.scale === "140x140";
          });
          return image.location;
        } else {
          return "../assets/img/profile-retina.jpg";
        }
      };

      GadgetCommentView.prototype.onRender = function() {
        this.updateTimeSince();
        if (!this.comment.isDeleted()) {
          return this.keepTimeSinceUpdated();
        }
      };

      GadgetCommentView.prototype.keepTimeSinceUpdated = function() {
        return setInterval(this.updateTimeSince, this.updateTimeSinceEveryMs);
      };

      GadgetCommentView.prototype.deleteComment = function() {
        return mediator.trigger('comment:deleted', this.comment);
      };

      GadgetCommentView.prototype.updateTimeSince = function() {
        var commentDate;
        commentDate = new Date(this.comment.get('createdAt'));
        return this.ui.createdAt.text(timeSince(commentDate));
      };

      return GadgetCommentView;

    })(Marionette.ItemView);
  });

}).call(this);
