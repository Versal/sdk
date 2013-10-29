(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.marionette', 'text!templates/nav-buttons.html', 'app/mediator', 'plugins/tracker'], function(Marionette, template, mediator, tracker) {
    var NavButtonsView;
    return NavButtonsView = (function(_super) {

      __extends(NavButtonsView, _super);

      function NavButtonsView() {
        this.templateHelpers = __bind(this.templateHelpers, this);

        this.buttonIf = __bind(this.buttonIf, this);

        this.isComplete = __bind(this.isComplete, this);

        this.nextAvailable = __bind(this.nextAvailable, this);

        this.previousAvailable = __bind(this.previousAvailable, this);
        return NavButtonsView.__super__.constructor.apply(this, arguments);
      }

      _.extend(NavButtonsView.prototype, tracker('Navigation Buttons'));

      NavButtonsView.prototype.className = 'nav-buttons';

      NavButtonsView.prototype.initialize = function() {
        return mediator.on('lesson:rendered', this.updateButtons, this);
      };

      NavButtonsView.prototype.onClose = function() {
        return mediator.off('lesson:rendered', this.updateButtons);
      };

      NavButtonsView.prototype.events = {
        'click .js-prev': 'onPreviousClick',
        'click .js-next': 'onNextClick',
        'click .js-finish': 'onFinishClick'
      };

      NavButtonsView.prototype.template = _.template(template);

      NavButtonsView.prototype.updateButtons = function(lessonView) {
        var model;
        this.lessonView = lessonView;
        model = this.lessonView.model;
        this.prev = this.model.lessons.at(this.model.lessons.indexOf(model) - 1);
        this.next = this.model.lessons.at(this.model.lessons.indexOf(model) + 1);
        this.lessonView.on('userStateSync', this.render, this);
        if (this.next) {
          this.next.on('change', this.render, this);
        }
        if (this._prevLessonView) {
          this._prevLessonView.off('userStateSync', this.render);
        }
        if (this._prevNext) {
          this._prevNext.off('change', this.render);
        }
        this._prevLessonView = this.lessonView;
        this._prevNext = this.next;
        return this.render();
      };

      NavButtonsView.prototype.onPreviousClick = function() {
        var destination;
        destination = 1 + this.model.lessons.indexOf(this.prev);
        mediator.trigger('lesson:navigate', destination);
        return this.track('Click Previous', {
          lesson: this.model.id,
          destination: destination
        });
      };

      NavButtonsView.prototype.onNextClick = function() {
        var destination;
        destination = 1 + this.model.lessons.indexOf(this.next);
        mediator.trigger('lesson:navigate', destination);
        return this.track('Click Next', {
          lesson: this.model.id,
          destination: destination
        });
      };

      NavButtonsView.prototype.onFinishClick = function() {
        mediator.trigger('parent:notify', {
          event: 'courseEnd'
        });
        return this.track('Click Finish', {
          lesson: this.model.id
        });
      };

      NavButtonsView.prototype.previousAvailable = function() {
        return (this.prev != null) && (this.prev.get('isAccessible') || this.model.get('isEditable'));
      };

      NavButtonsView.prototype.nextAvailable = function() {
        return (this.next != null) && (this.next.get('isAccessible') || this.model.get('isEditable'));
      };

      NavButtonsView.prototype.isComplete = function() {
        var _ref;
        return ((_ref = this.lessonView) != null ? _ref.isComplete() : void 0) && !this.next;
      };

      NavButtonsView.prototype.buttonIf = function(criterion, classname, content, position) {
        if (criterion) {
          return "<a class='nav-button " + classname + " pull-" + position + "'>\n  <i class='icon-caret-" + position + " pull-" + position + "'></i>\n  <span class='nav-button-text'>" + content + "</span>\n</a>";
        }
      };

      NavButtonsView.prototype.templateHelpers = function() {
        return {
          previousAvailable: this.previousAvailable,
          nextAvailable: this.nextAvailable,
          isComplete: this.isComplete,
          buttonIf: this.buttonIf
        };
      };

      return NavButtonsView;

    })(Marionette.CompositeView);
  });

}).call(this);
