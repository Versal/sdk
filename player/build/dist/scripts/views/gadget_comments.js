(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'views/gadget_comment', 'app/mediator', 'plugins/tracker', 'text!templates/gadget_comments.html'], function(Marionette, GadgetCommentView, mediator, tracker, template) {
    var GadgetCommentsView;
    return GadgetCommentsView = (function(_super) {

      __extends(GadgetCommentsView, _super);

      function GadgetCommentsView() {
        this.updateCount = __bind(this.updateCount, this);
        return GadgetCommentsView.__super__.constructor.apply(this, arguments);
      }

      _.extend(GadgetCommentsView.prototype, tracker('Comments'));

      GadgetCommentsView.prototype.ui = {
        commentText: '.submit-comment-text',
        commentsCount: '.comments-count',
        commentsDisplay: '.comments-box'
      };

      GadgetCommentsView.prototype.events = {
        'click .js-submit-comment': 'onCommentSubmit',
        'click .js-cancel-comment': 'onCommentCancel',
        'click .js-comments-toggle': 'onToggleClick',
        'click': 'onClick'
      };

      GadgetCommentsView.prototype.template = _.template(template);

      GadgetCommentsView.prototype.templateHelpers = function() {
        return {
          commentCount: this.commentCount()
        };
      };

      GadgetCommentsView.prototype.itemView = GadgetCommentView;

      GadgetCommentsView.prototype.itemViewContainer = '.inner-comments';

      GadgetCommentsView.prototype.initialize = function(options) {
        this.gadget = this.model;
        this.comments = this.collection;
        this.comments.on('add remove reset', this.updateCount);
        mediator.on('comment:add', this.addComment, this);
        mediator.on('comment:delete', this.deleteComment, this);
        return mediator.on('comments:click', this.onCommentsClick, this);
      };

      GadgetCommentsView.prototype.onRender = function() {
        mediator.on('course:collab:ready', this.enable, this);
        return mediator.on('course:collab:close', this.disable, this);
      };

      GadgetCommentsView.prototype.disable = function() {
        return this.enabled = false;
      };

      GadgetCommentsView.prototype.enable = function() {
        return this.enabled = true;
      };

      GadgetCommentsView.prototype.addComment = function(comment) {
        var gadgetId;
        gadgetId = comment.get('gadgetId');
        if (gadgetId === this.gadget.id) {
          return this.comments.push(comment);
        }
      };

      GadgetCommentsView.prototype.deleteComment = function(comment) {
        var gadgetId;
        gadgetId = comment.get('gadgetId');
        if (gadgetId === this.gadget.id) {
          return this.comments.remove(comment);
        }
      };

      GadgetCommentsView.prototype.onCommentSubmit = function() {
        var comment;
        if (!this.enabled) {
          return alert('This feature is currently disabled.');
        } else if (this.ui.commentText.val()) {
          comment = new vs.collab.GadgetComment({
            gadgetId: this.gadget.id,
            body: this.ui.commentText.val()
          });
          this.ui.commentText.val('');
          return mediator.trigger('comment:added', comment);
        }
      };

      GadgetCommentsView.prototype.commentCount = function() {
        var count;
        count = this.comments.size();
        if (count > 99) {
          return '99+';
        } else if (count <= 0) {
          return '+';
        } else {
          return count;
        }
      };

      GadgetCommentsView.prototype.updateCount = function() {
        return this.ui.commentsCount.text(this.commentCount());
      };

      GadgetCommentsView.prototype.onCommentCancel = function() {
        this.ui.commentText.val('');
        return this.ui.commentsDisplay.hide();
      };

      GadgetCommentsView.prototype.onClick = function(e) {
        return mediator.trigger('comments:click', e, this);
      };

      GadgetCommentsView.prototype.blur = function() {
        return this.ui.commentsDisplay.hide();
      };

      GadgetCommentsView.prototype.onCommentsClick = function(e, commentsView) {
        if (commentsView !== this || e.target === this.el) {
          return this.ui.commentsDisplay.hide();
        }
      };

      GadgetCommentsView.prototype.onToggleClick = function(e) {
        return this.ui.commentsDisplay.toggle();
      };

      return GadgetCommentsView;

    })(Marionette.CompositeView);
  });

}).call(this);
