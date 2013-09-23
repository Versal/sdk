(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.marionette', 'text!templates/learner_sidebar.html', 'text!templates/learner_sidebar_item.html', 'app/mediator', 'plugins/tracker', './sidebar'], function(Marionette, template, itemTemplate, mediator, tracker, Sidebar) {
    var LearnerLesson, LearnerSidebar;
    LearnerLesson = (function(_super) {

      __extends(LearnerLesson, _super);

      function LearnerLesson() {
        return LearnerLesson.__super__.constructor.apply(this, arguments);
      }

      LearnerLesson.prototype.initialize = function() {
        return this.model.on('change', this.render, this);
      };

      LearnerLesson.prototype.tagName = 'li';

      LearnerLesson.prototype.className = 'lesson';

      LearnerLesson.prototype.template = _.template(itemTemplate);

      LearnerLesson.prototype.events = {
        'click': 'select'
      };

      LearnerLesson.prototype.select = function() {
        return this.trigger('select', this.model);
      };

      LearnerLesson.prototype.onRender = function() {
        if (!this.model.get('isAccessible')) {
          return this.$el.addClass('disabled-lesson');
        }
      };

      return LearnerLesson;

    })(Marionette.ItemView);
    return LearnerSidebar = (function(_super) {

      __extends(LearnerSidebar, _super);

      function LearnerSidebar() {
        this.templateHelpers = __bind(this.templateHelpers, this);
        return LearnerSidebar.__super__.constructor.apply(this, arguments);
      }

      _.extend(LearnerSidebar.prototype, Sidebar);

      _.extend(LearnerSidebar.prototype, tracker('Learner Sidebar'));

      LearnerSidebar.prototype.initialize = function() {
        this.model.on('change', this.render, this);
        mediator.on('lesson:rendered', this.updateActiveLesson, this);
        this.collection = this.model.lessons;
        return this.on('itemview:select', this.selectLesson, this);
      };

      LearnerSidebar.prototype.remove = function() {
        mediator.off('lesson:rendered', this.updateActiveLesson, this);
        return LearnerSidebar.__super__.remove.apply(this, arguments);
      };

      LearnerSidebar.prototype.itemView = LearnerLesson;

      LearnerSidebar.prototype.itemViewContainer = '.lesson-list';

      LearnerSidebar.prototype.ui = {
        lessonList: '.lesson-list'
      };

      LearnerSidebar.prototype.className = 'learnerSidebar';

      LearnerSidebar.prototype.template = _.template(template);

      LearnerSidebar.prototype.events = {
        'click .js-navigate-lesson': 'selectLesson',
        'click .versal-logo': 'onLogoClick'
      };

      LearnerSidebar.prototype.selectLesson = function(lessonView) {
        var lesson;
        lesson = lessonView.model;
        if (!lesson.get('isAccessible')) {
          return;
        }
        mediator.trigger('lesson:navigate', this.model.lessons.indexOf(lesson) + 1);
        return this.track('Select lesson', {
          lesson: lesson.id
        });
      };

      LearnerSidebar.prototype.updateActiveLesson = function(activeView) {
        var lesson;
        this.activeView = activeView;
        lesson = this.activeView.model;
        this.$('.active-lesson').removeClass('active-lesson');
        return this.children.findByModel(lesson).$el.addClass('active-lesson');
      };

      LearnerSidebar.prototype.templateHelpers = function() {
        var _this = this;
        return {
          whitelabel: function() {
            return _this.options.whitelabel;
          }
        };
      };

      LearnerSidebar.prototype.onRender = function() {
        if (this.activeView) {
          this.updateActiveLesson(this.activeView);
        }
        return this.scroll = new vs.ui.Scroll(this.ui.lessonList);
      };

      return LearnerSidebar;

    })(Marionette.CompositeView);
  });

}).call(this);
