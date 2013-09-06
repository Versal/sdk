(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/course.html', 'views/lesson', 'app/mediator', 'plugins/tracker', '../../toc/main', 'views/nav_buttons'], function(Marionette, template, LessonView, mediator, tracker, TOCView, NavButtonsView) {
    var Course;
    return Course = (function(_super) {

      __extends(Course, _super);

      function Course() {
        this.onToggleTOC = __bind(this.onToggleTOC, this);

        this.customScroller = __bind(this.customScroller, this);
        return Course.__super__.constructor.apply(this, arguments);
      }

      _.extend(Course.prototype, tracker('Course'));

      Course.prototype.initialize = function() {
        var _this = this;
        this._lessonTitleBlurrable = true;
        this.listenTo(this.model, 'change', this.onCourseChanged, this);
        this.listenTo(this.model.lessons, 'add', this.onLessonsAdd, this);
        this.listenTo(this.model.lessons, 'remove', this.onLessonsRemove, this);
        this.listenTo(this.model.lessons, 'select', this.onLessonSelected, this);
        this.listenTo(this.model.lessons, 'change:title', function(model, title) {
          return _this.updateTitle();
        });
        this.ensureLesson();
        mediator.on('toc:show', function() {
          return _this.ui.tocIcon.addClass('active');
        });
        return mediator.on('toc:hide', function() {
          return _this.ui.tocIcon.removeClass('active');
        });
      };

      Course.prototype.ui = {
        lessonTitle: '.lessonTitle',
        lessonTitleWrapper: '.lessonTitleWrapper',
        courseTitle: '.courseTitle',
        courseTitleWrapper: '.courseTitleWrapper',
        title: '.title',
        tocIcon: '.toc-icon',
        errorMsg: '.saveErrorMsg'
      };

      Course.prototype.regions = {
        lessonRegion: '.lessons',
        toc: '.toc',
        nav: '.nav'
      };

      Course.prototype.events = {
        'click .js-toggle-toc': 'onToggleTOC',
        'click .lessonTitle': 'startEditingLessonTitle',
        'click .courseTitle': 'startEditingCourseTitle'
      };

      Course.prototype.template = _.template(template);

      Course.prototype.itemView = LessonView;

      Course.prototype.itemViewContainer = '.lessons';

      Course.prototype.className = function() {
        if (this.options.embed) {
          return 'course embed-frame';
        } else if (this.model.get('isEditable')) {
          return 'course editable';
        } else {
          return 'course';
        }
      };

      Course.prototype.serializeData = function() {
        return _.extend(this.model.toJSON(), {
          firstLessonTitle: this.model.lessons.first().get('title')
        });
      };

      Course.prototype.ensureLesson = function() {
        if (this.model.lessons.length === 0) {
          return this.model.lessons.create({});
        }
      };

      Course.prototype.getLessonView = function(lesson) {
        return this.children.findByModel(lesson);
      };

      Course.prototype.activeLessonIndex = function() {
        return this.model.lessons.indexOf(this._activeLesson);
      };

      Course.prototype.activateLesson = function(lesson) {
        var _this = this;
        if (this.loadingLesson) {
          this.loadingLesson.abort();
        }
        this.renderingLesson = $.Deferred();
        if (this.model.lessons.indexOf(lesson) === -1 || lesson === this._activeLesson) {
          this.renderingLesson.resolve();
          return false;
        }
        this.stopEditingCourseTitle();
        this.stopEditingLessonTitle();
        this.loadingLesson = lesson.fetch();
        return this.loadingLesson.done(function() {
          return _this.displayLesson(lesson);
        });
      };

      Course.prototype.displayLesson = function(lesson) {
        this._activeLesson = lesson;
        this.model.progress.save({
          lessonIndex: this.activeLessonIndex() + 1
        });
        if (this._lessonView) {
          this._lessonView.off('menuDeactivated');
          this._lessonView.off('itemview:dblclick');
          this._lessonView.close();
        }
        this._lessonView = new LessonView({
          model: this._activeLesson,
          embed: this.options.embed,
          isEditable: this.model.get('isEditable')
        });
        this._lessonView.on('menuDeactivated', this.showHoverables, this);
        this._lessonView.on('itemview:dblclick', this.onInstanceClicked, this);
        this.lessonRegion.show(this._lessonView);
        if (this.renderingLesson) {
          this.renderingLesson.resolve();
        }
        mediator.trigger('lesson:rendered', this._lessonView);
        this.updateTitle();
        return _.delay((function() {
          return window.scrollTo(0, 0);
        }), 1000);
      };

      Course.prototype.addNewLesson = function(atIndex) {
        var index;
        index = atIndex || this.activeLessonIndex() + 1;
        this.model.lessons.create({}, {
          at: index
        });
        return this.displayLesson(this.model.lessons.at(index));
      };

      Course.prototype.deleteLesson = function(atIndex) {
        var index;
        index = atIndex || this.activeLessonIndex();
        return this.model.lessons.destroy(this.model.lessons.at(this.activeLessonIndex()));
      };

      Course.prototype.startEditing = function(field) {
        if (!this.model.get('isEditable')) {
          return;
        }
        field.toggleEdit(true);
        field.$el.parent().addClass('editing');
        return this._lessonView.showHoverables(false);
      };

      Course.prototype.startEditingCourseTitle = function() {
        this.startEditing(this._courseTitle);
        return this._isEditingCourse = true;
      };

      Course.prototype.startEditingLessonTitle = function() {
        this.startEditing(this._lessonTitle);
        return this._isEditingLesson = true;
      };

      Course.prototype.stopEditing = function(model, field) {
        model.save({
          title: field.getPretty()
        });
        field.toggleEdit(false);
        field.$el.parent().removeClass('editing');
        return this._lessonView.showHoverables(true);
      };

      Course.prototype.stopEditingCourseTitle = function() {
        if (!this._isEditingCourse) {
          return;
        }
        this.stopEditing(this.model, this._courseTitle);
        this._isEditingCourse = false;
        return this.track('Change Title', {
          course: this.model.id,
          title: this._courseTitle.getPretty()
        });
      };

      Course.prototype.stopEditingLessonTitle = function() {
        if (!this._isEditingLesson) {
          return;
        }
        this.stopEditing(this._activeLesson, this._lessonTitle);
        this._isEditingLesson = false;
        return this.track('Change Lesson Title', {
          lesson: this._activeLesson.id,
          title: this._lessonTitle.getPretty()
        });
      };

      Course.prototype.onCourseChanged = function() {
        return this.updateTitle();
      };

      Course.prototype.onInstanceClicked = function() {
        this.stopEditingLessonTitle();
        return this.stopEditingCourseTitle();
      };

      Course.prototype.onLessonsRemove = function(lesson, collection, options) {
        var index;
        if (collection.length === 0) {
          this.addNewLesson(0);
          this.displayLesson(this.model.lessons.at(0));
        }
        if (lesson === this._activeLesson) {
          index = Math.min(options.index, collection.length - 1);
          return this.activateLesson(this.model.lessons.at(index));
        }
      };

      Course.prototype.onLessonSelected = function(lesson) {
        return this.activateLesson(lesson);
      };

      Course.prototype.onLessonsChange = function() {
        return this.updateTitle();
      };

      Course.prototype.onRender = function() {
        var _this = this;
        this._rendered = true;
        this._lessonTitle = new vs.ui.EditableText({
          el: this.ui.lessonTitle,
          type: 'input',
          complete: function() {
            return _this.stopEditingLessonTitle();
          },
          maxlength: 50
        });
        this._courseTitle = new vs.ui.EditableText({
          el: this.ui.courseTitle,
          type: 'input',
          complete: function() {
            return _this.stopEditingCourseTitle();
          },
          maxlength: 60
        });
        this.activateLesson(this._activeLesson || this.model.lessons.first());
        this.toc.show(new TOCView({
          model: this.model
        }));
        this.toc.ready = true;
        this.tocScroll = new vs.ui.Scroll(this.toc.$el);
        this.nav.show(new NavButtonsView({
          model: this.model
        }));
        mediator.on('api:xhr:error', this.showSaveErrorMsg, this);
        return mediator.on('api:xhr:success', this.hideSaveErrorMsg, this);
      };

      Course.prototype.scrollWidth = function() {
        var windowWidth;
        windowWidth = $(window).width();
        if (windowWidth < 1024) {
          return windowWidth;
        } else {
          return windowWidth - 263;
        }
      };

      Course.prototype.customScroller = function() {
        return this.scroller = new vs.ui.Scroll($('html'));
      };

      Course.prototype.onShow = function() {
        return this.customScroller();
      };

      Course.prototype.onToggleTOC = function() {
        mediator.trigger('toc:toggle');
        return this.track('Toggle ToC', {
          course: this.model.id
        });
      };

      Course.prototype.updateTitle = function() {
        if (!this._rendered) {
          return;
        }
        return this.ui.lessonTitle.text(this._activeLesson.get('title'));
      };

      Course.prototype.showLesson = function(lessonIndex) {
        var lesson;
        lesson = this.model.lessons.at(lessonIndex - 1);
        return this.activateLesson(lesson);
      };

      Course.prototype.showGadget = function(lessonIndex, gadgetIndex) {
        var _this = this;
        this.showLesson(lessonIndex);
        return this.renderingLesson.done(function() {
          return _this._lessonView.showGadget(gadgetIndex);
        });
      };

      Course.prototype.showSaveErrorMsg = function() {
        if (!(this.errorShowing || !this.model.get('isEditable'))) {
          this.ui.errorMsg.slideDown(50);
          return this.errorShowing = true;
        }
      };

      Course.prototype.hideSaveErrorMsg = function() {
        if (this.errorShowing) {
          this.errorShowing = false;
          return this.ui.errorMsg.slideUp(50);
        }
      };

      return Course;

    })(Marionette.Layout);
  });

}).call(this);
