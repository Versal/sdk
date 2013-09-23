(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['cdn.marionette', 'views/course', 'views/sidebar/author/author', 'views/sidebar/learner', 'app/catalogue', 'text!templates/player.html', 'views/loading', 'app/mediator', 'plugins/tracker', 'messages/decorate', 'modernizr', 'plugins/vs.ui', 'models/video'], function(Marionette, CourseView, AuthorSidebarView, LearnerSidebarView, gadgetCatalogue, template, LoadingView, mediator, tracker) {
    var PlayerApplication, PlayerLayout, PlayerRouter;
    PlayerLayout = (function(_super) {

      __extends(PlayerLayout, _super);

      function PlayerLayout() {
        return PlayerLayout.__super__.constructor.apply(this, arguments);
      }

      PlayerLayout.prototype.template = template;

      PlayerLayout.prototype.regions = {
        sidebar: '.sidebar',
        dialogs: '.dialogs',
        courseContainer: '.container',
        position: '.scrubBar',
        loading: '.loadingCourse'
      };

      return PlayerLayout;

    })(Marionette.Layout);
    PlayerRouter = (function(_super) {

      __extends(PlayerRouter, _super);

      function PlayerRouter() {
        return PlayerRouter.__super__.constructor.apply(this, arguments);
      }

      PlayerRouter.prototype.initialize = function() {
        var router;
        mediator.on('lesson:navigate', this.navigateLesson, this);
        this.on('route:showLesson route:showGadget route:showCourse', this.updateId, this);
        router = this;
        return $(document).on('click', 'a.js-navigate', function() {
          router.navigate("courses/" + router.courseId + "/" + ($(this).attr('href')), {
            trigger: true
          });
          return false;
        });
      };

      PlayerRouter.prototype.routes = {
        'learn': 'learn',
        'courses/:courseId': 'showCourse',
        'courses/:courseId/lessons/:lessonIndex': 'showLesson',
        'courses/:courseId/lessons/:lessonIndex/gadgets/:gadgetIndex': 'showGadget'
      };

      PlayerRouter.prototype.updateId = function(courseId) {
        this.courseId = courseId;
      };

      PlayerRouter.prototype.navigateLesson = function(lessonIndex) {
        return this.navigate("courses/" + this.courseId + "/lessons/" + lessonIndex, {
          trigger: true
        });
      };

      PlayerRouter.prototype.navigateGadget = function(lessonIndex, gadgetIndex) {
        return this.navigate("courses/" + this.courseId + "/lessons/" + lessonIndex + "/gadgets/" + gadgetIndex, {
          trigger: true
        });
      };

      return PlayerRouter;

    })(Backbone.Router);
    return PlayerApplication = (function() {

      _.extend(PlayerApplication.prototype, tracker('Player'));

      PlayerApplication.prototype.defaults = {
        whitelabel: false,
        embed: false
      };

      function PlayerApplication(options) {
        this.onProgressLoad = __bind(this.onProgressLoad, this);

        this.onCourseLoad = __bind(this.onCourseLoad, this);

        var courseId, el,
          _this = this;
        if (!_.has(options, 'api')) {
          throw new Error('Please set options.api!');
        }
        vs.api.init(options.api);
        vs.api.on('xhr:start', function(xhr) {
          return _this.startTimer(xhr.requestUrl);
        });
        vs.api.on('xhr:error', function(opts, e, xhr) {
          _this.endTimer(xhr.requestUrl, {
            status: 'error'
          });
          return mediator.trigger('api:xhr:error');
        });
        vs.api.on('xhr:success', function(opts, e, xhr) {
          _this.endTimer(xhr.requestUrl, {
            status: 'success'
          });
          return mediator.trigger('api:xhr:success');
        });
        this.baseUrl = options && options.requireRoot ? options.requireRoot : '/';
        if (!this.baseUrl.match(/\/$/)) {
          this.baseUrl += '/';
        }
        require.config({
          baseUrl: this.baseUrl
        });
        mediator.on('player:style:register', this.registerStylesheet, this);
        this._courseRendering = $.Deferred();
        this._courseRendering.done(function() {
          return mediator.trigger('course:rendered', _this.courseView);
        });
        this.router = new PlayerRouter;
        this.options = _.extend({}, this.defaults, options);
        courseId = this.options.courseId;
        this.trackerSetup({
          sessionId: this.options.api.sessionId,
          interactionId: _.random(1e15, 1e16).toString(32)
        });
        if (courseId) {
          this.router.courseId = courseId;
        }
        this.router.on('route:showLesson', this.showLesson, this);
        this.router.on('route:showGadget', this.showGadget, this);
        this.router.on('route:learn', this.becomeLearner, this);
        Backbone.history.start({
          root: window.location.pathname
        });
        if (this.options.container) {
          el = $(this.options.container).get(0);
        }
        this.layout = new PlayerLayout({
          el: el
        });
        this.layout.render();
        this.loadingView = new LoadingView;
        this.layout.loading.show(this.loadingView);
        mediator.on('gadget:rendered', function(g, all) {
          if (all) {
            return _this.loadingView.hide((function() {
              return _this.layout.loading.reset();
            }));
          }
        });
        gadgetCatalogue.fetchAll();
        if (this.router.courseId) {
          this.loadCourse(this.router.courseId);
        } else {
          this.buildCourse();
        }
      }

      PlayerApplication.prototype.isLearner = false;

      PlayerApplication.prototype.becomeLearner = function() {
        return this.isLearner = true;
      };

      PlayerApplication.prototype.registerStylesheet = function(options) {
        if ($("head link." + options.key).length) {
          return;
        }
        return $('<link rel="stylesheet" type="text/css" />').attr('href', options.url).addClass(options.key).appendTo('head');
      };

      PlayerApplication.prototype.buildCourse = function() {
        var course;
        course = new vs.api.Course({
          lessons: [
            {
              title: 'lesson 1'
            }
          ]
        });
        return this.onCourseLoad(course);
      };

      PlayerApplication.prototype.loadCourse = function(courseId) {
        var courseBaseUrl, courseModel, progressFetch,
          _this = this;
        this.track('Begin Loading', {
          course: courseId
        });
        courseModel = new vs.api.Course({
          id: courseId
        });
        courseModel.set({
          isEditable: false
        });
        progressFetch = courseModel.progress.fetch();
        progressFetch.success(this.onProgressLoad);
        if (this.options.revision) {
          courseBaseUrl = courseModel.url();
          courseModel.url = function() {
            return _this.baseUrl + 'catalogs/staged' + courseBaseUrl;
          };
        }
        courseModel.fetch({
          success: function(model) {
            return $.when(progressFetch).then(function() {
              return _this.onCourseLoad(model);
            });
          },
          silent: true
        });
        return this.course = courseModel;
      };

      PlayerApplication.prototype.handleException = function(e) {
        if (e instanceof vs.api.errors.ApplicationError) {
          return console.log('app error');
        } else if (e instanceof vs.api.errors.NotFound) {
          return console.log('not found');
        } else if (e instanceof vs.api.errors.PermissionDenied) {
          return console.log('permission denied');
        } else {
          return console.log('error');
        }
      };

      PlayerApplication.prototype.onCourseLoad = function(courseModel) {
        var viewOpts;
        this.track('Finish Loading', {
          course: courseModel.id,
          editable: courseModel.get('isEditable')
        });
        if (this.options.noEditable || this.isLearner || this.options.embed) {
          courseModel.set({
            isEditable: false
          });
        }
        viewOpts = {
          embed: this.options.embed,
          model: courseModel,
          whitelabel: this.options.whitelabel
        };
        this.courseView = new CourseView(viewOpts);
        this.layout.courseContainer.show(this.courseView);
        if (courseModel.get('isEditable')) {
          this.layout.sidebar.show(new AuthorSidebarView(viewOpts));
        } else {
          this.layout.sidebar.show(new LearnerSidebarView(viewOpts));
        }
        courseModel.parse = function(attrs) {
          attrs.lessons = _.map(attrs.lessons, function(lesson) {
            return _.omit(lesson, 'gadgets');
          });
          this.lessons.set(attrs.lessons);
          return _.omit(attrs, 'lessons');
        };
        return this._courseRendering.resolve();
      };

      PlayerApplication.prototype.onProgressLoad = function(model) {
        if (model == null) {
          model = {};
        }
        if (model.lessonIndex) {
          if (model.gadgetIndex) {
            return this.router.navigateGadget(model.lessonIndex, model.gadgetIndex);
          } else {
            return this.router.navigateLesson(model.lessonIndex);
          }
        }
      };

      PlayerApplication.prototype.showLesson = function(courseId, lessonIndex) {
        var _this = this;
        return this._courseRendering.done(function() {
          return _this.courseView.showLesson(lessonIndex);
        });
      };

      PlayerApplication.prototype.showGadget = function(courseId, lessonIndex, gadgetIndex) {
        var _this = this;
        return this._courseRendering.done(function() {
          return _this.courseView.showGadget(lessonIndex, gadgetIndex);
        });
      };

      return PlayerApplication;

    })();
  });

}).call(this);
