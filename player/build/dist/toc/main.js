(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["cdn.jquery", "cdn.marionette", "text!./student.html", "text!./author.html", "cdn.jqueryui", "app/mediator"], function($, Marionette, studentTemplate, authorTemplate, jqueryUI, mediator) {
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
