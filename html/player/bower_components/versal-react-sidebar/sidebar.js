(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('react'), require('react-coffeescript-glue'));
  }
  else if (typeof define === 'function' && define.amd) {
    define(['react', 'react-coffeescript-glue'], factory);
  }
  else {
    var globalAlias = 'SidebarCourseComponent';
    var namespace = globalAlias.split('.');
    var parent = root;
    for ( var i = 0; i < namespace.length-1; i++ ) {
      if ( parent[namespace[i]] === undefined ) parent[namespace[i]] = {};
      parent = parent[namespace[i]];
    }
    parent[namespace[namespace.length-1]] = factory(root['React'], root['ReactCoffeescriptGlue']);
  }
}(this, function(React, ReactCoffeescriptGlue) {
  function _requireDep(name) {
    return {'react': React, 'react-coffeescript-glue': ReactCoffeescriptGlue}[name];
  }

  var _bundleExports = (function() {
  var PlaceholderTextComponent, RenderInBodyAdapter, SidebarCourseComponent, SidebarCourseTitleComponent, SidebarDragImageComponent, SidebarDropdownComponent, SidebarLessonComponent, SidebarSectionComponent, TimeSinceComponent, dragXOffset;

  dragXOffset = 10;

  PlaceholderTextComponent = React.createClass({
    render: function() {
      var text;
      text = this.props.children.trim();
      if (text) {
        return _span([], text);
      } else {
        return _span(['sidebar-placeholder-text'], this.props.placeholder);
      }
    }
  });

  SidebarSectionComponent = React.createClass({
    _onClick: function(e) {
      if (!this.props.isAccessible) {
        return;
      }
      this.props.onClick();
      return e.stopPropagation();
    },
    render: function() {
      return _div([
        'sidebar-section-title', this.props.hasCompletedSection || this.props.isCurrentSection ? 'sidebar-toc-progressed' : void 0, this.props.isCurrentSection ? 'sidebar-toc-active' : void 0, {
          onClick: this._onClick
        }
      ], this.props.title);
    }
  });

  SidebarDragImageComponent = React.createClass({
    _dragYOffset: function() {
      if (this.isMounted()) {
        return this.getDOMNode().offsetHeight / 2;
      } else {
        return 0;
      }
    },
    render: function() {
      return _div([
        'sidebar-lesson sidebar-lesson-drag-image', {
          style: {
            left: this.props.x - dragXOffset,
            top: this.props.y - this._dragYOffset(),
            width: this.props.width
          }
        }
      ], _div(['sidebar-lesson-title'], _div(['sidebar-lesson-title-readonly'], PlaceholderTextComponent({
        placeholder: this.props.placeholder
      }, this.props.title))));
    }
  });

  RenderInBodyAdapter = React.createClass({
    componentWillMount: function() {
      this._elementInBody = document.createElement('div');
      return document.body.appendChild(this._elementInBody);
    },
    componentWillUnmount: function() {
      React.unmountComponentAtNode(this._elementInBody);
      return document.body.removeChild(this._elementInBody);
    },
    render: function() {
      return _span();
    },
    componentDidMount: function() {
      return this._renderElementInBody();
    },
    componentDidUpdate: function() {
      return this._renderElementInBody();
    },
    _renderElementInBody: function() {
      return React.renderComponent(this.props.children, this._elementInBody);
    }
  });

  SidebarLessonComponent = React.createClass({
    _onClick: function(e) {
      if (!this.props.isAccessible) {
        return;
      }
      this.props.onClick();
      return e.stopPropagation();
    },
    _renderSections: function() {
      return this.props.gadgets.map((function(_this) {
        return function(gadget, gadgetIndex) {
          var trimmedTitle;
          if (gadget.type !== _this.props.sectionGadgetType) {
            return;
          }
          trimmedTitle = (gadget.config.content || '').trim();
          if (trimmedTitle === '') {
            return;
          }
          return SidebarSectionComponent({
            key: gadget.id,
            title: trimmedTitle,
            isAccessible: _this.props.isAccessible,
            hasCompletedSection: _this.props.hasCompletedLesson || (_this.props.isCurrentLesson && gadgetIndex <= _this.props.currentGadgetIndex),
            isCurrentSection: _this.props.isCurrentLesson && gadgetIndex === _this.props.currentGadgetIndex,
            onClick: function() {
              return _this.props.onClickSection(gadgetIndex);
            }
          });
        };
      })(this));
    },
    getInitialState: function() {
      return {
        editing: false,
        dragImageContainer: null,
        customDragImageX: null,
        customDragImageY: null
      };
    },
    _onDragEnter: function(e) {
      e.preventDefault();
      return e.dataTransfer.dropEffect = 'move';
    },
    _onDragOver: function(e) {
      var append, height, relY;
      e.preventDefault();
      relY = e.clientY - this.getDOMNode().getBoundingClientRect().top;
      height = this.getDOMNode().offsetHeight / 2;
      append = relY > height;
      return this.props.onDragMove(append);
    },
    _onDrag: function(e) {
      return this.setState({
        customDragImageX: e.clientX,
        customDragImageY: e.clientY
      });
    },
    _onDragEnd: function() {
      return this.setState({
        renderCustomDragImage: false,
        customDragImageX: null,
        customDragImageY: null
      });
    },
    _onDrop: function(e) {
      return e.preventDefault();
    },
    _dragHandleOnDragStart: function(e) {
      var dragHandleY;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('Text', this.props.title);
      if (e.dataTransfer.setDragImage) {
        dragHandleY = this.refs.title.getDOMNode().offsetHeight / 2;
        e.dataTransfer.setDragImage(this.getDOMNode(), dragXOffset, dragHandleY);
        return setTimeout(this.props.onDragStart, 0);
      } else {
        this.props.onDragStart();
        return this.setState({
          renderCustomDragImage: true
        });
      }
    },
    _dragHandleOnDragEnd: function() {
      this.props.onDragEnd();
      this.props.onHoverStart();
      return setTimeout(((function(_this) {
        return function() {
          return _this.props.onHoverStart();
        };
      })(this)), 50);
    },
    render: function() {
      var lessonPlaceholder, _ref;
      lessonPlaceholder = 'Untitled lesson';
      return _div([
        'sidebar-lesson', !this.props.isAccessible ? 'sidebar-lesson-disabled' : void 0, this.state.editing ? 'sidebar-lesson-editing' : void 0, this.props.editable ? 'sidebar-lesson-editable' : void 0, this.props.hovered ? 'sidebar-lesson-hovered' : void 0, this.props.dragging ? 'sidebar-lesson-dragging' : void 0, this.props.hasCompletedLesson || this.props.isCurrentLesson ? 'sidebar-toc-progressed' : void 0, this.props.isCurrentLesson ? 'sidebar-toc-active' : void 0, {
          onClick: this._onClick,
          onDragEnter: this._onDragEnter,
          onDragOver: this._onDragOver,
          onDrag: this._onDrag,
          onDragEnd: this._onDragEnd,
          onDrop: this._onDrop,
          onMouseEnter: this.props.onHoverStart,
          onMouseMove: this.props.onHoverStart,
          onMouseLeave: this.props.onHoverEnd
        }
      ], this.props.editable ? _div([], _div([
        'sidebar-lesson-drag-handle', {
          draggable: true,
          onDragStart: this._dragHandleOnDragStart,
          onDragEnd: this._dragHandleOnDragEnd
        }
      ], _i(['icon-reorder'])), _div([
        'sidebar-lesson-delete-button', {
          onClick: function(e) {
            return e.stopPropagation();
          },
          onMouseDown: (function(_this) {
            return function(e) {
              if (confirm('Are you sure you want to delete this lesson?')) {
                return _this.props.onDelete();
              }
            };
          })(this)
        }
      ], _i(['icon-remove'])), this.state.editing ? _div([
        'sidebar-lesson-edit-button', {
          key: 'edit-button-editing'
        }
      ], _i(['icon-pencil'])) : _div([
        'sidebar-lesson-edit-button', {
          key: 'edit-button-not-editing',
          onClick: (function(_this) {
            return function(e) {
              e.stopPropagation();
              return _this.setState({
                editing: !_this.state.editing
              });
            };
          })(this)
        }
      ], _i(['icon-pencil']))) : void 0, _div([
        'sidebar-lesson-title', {
          ref: 'title'
        }
      ], this.state.editing ? _input([
        'sidebar-lesson-title-input', {
          value: this.props.title,
          ref: 'lessonTitleInput',
          placeholder: lessonPlaceholder,
          onClick: (function(_this) {
            return function(e) {
              return e.stopPropagation();
            };
          })(this),
          onBlur: (function(_this) {
            return function() {
              return _this.setState({
                editing: false
              });
            };
          })(this),
          onKeyDown: (function(_this) {
            return function(e) {
              var _ref;
              if ((_ref = e.key) === 'Enter' || _ref === 'Escape') {
                return _this.setState({
                  editing: false
                });
              }
            };
          })(this),
          onChange: (function(_this) {
            return function(e) {
              return _this.props.onChangeTitle(e.target.value);
            };
          })(this)
        }
      ]) : _div(['sidebar-lesson-title-readonly'], PlaceholderTextComponent({
        placeholder: lessonPlaceholder
      }, this.props.title))), _div([], this._renderSections()), _i([
        'sidebar-lesson-lock icon-lock', {
          title: 'This lesson is locked by one or more quizzes'
        }
      ]), this.state.renderCustomDragImage ? RenderInBodyAdapter({}, SidebarDragImageComponent({
        title: this.props.title,
        x: this.state.customDragImageX,
        y: this.state.customDragImageY,
        width: (_ref = this.getDOMNode()) != null ? _ref.offsetWidth : void 0,
        placeholder: lessonPlaceholder
      })) : void 0);
    },
    componentDidMount: function() {
      return this._afterRender(false);
    },
    componentDidUpdate: function(prevProps, prevState) {
      return this._afterRender(prevProps.isCurrentLesson);
    },
    _afterRender: function(prevIsCurrentLesson) {
      var scrollContainer, _ref;
      if (!this.getDOMNode().offsetParent) {
        return console.warn('Invariant violation: SidebarLessonComponent has no offsetParent, probably not attached to the DOM yet');
      }
      if (!this.getDOMNode().offsetParent.className.match('sidebar-body')) {
        return console.warn('Invariant violation: SidebarLessonComponent offsetParent is not the sidebar body!');
      }
      if (this.props.isCurrentLesson && !prevIsCurrentLesson) {
        scrollContainer = this.getDOMNode().offsetParent;
        if (!((scrollContainer.scrollTop <= (_ref = this.getDOMNode().offsetTop) && _ref <= scrollContainer.scrollTop + scrollContainer.offsetHeight))) {
          scrollContainer.scrollTop = this.getDOMNode().offsetTop - scrollContainer.offsetHeight / 2;
        }
      }
      if (this.state.editing) {
        return this.refs.lessonTitleInput.getDOMNode().focus();
      }
    }
  });

  SidebarCourseTitleComponent = React.createClass({
    getInitialState: function() {
      return {
        editing: false
      };
    },
    render: function() {
      var coursePlaceholder;
      coursePlaceholder = 'Untitled course';
      return _div(['sidebar-course-title'], this.state.editing ? _input([
        'sidebar-course-title-input', {
          value: this.props.title,
          ref: 'input',
          placeholder: coursePlaceholder,
          onBlur: (function(_this) {
            return function() {
              return _this.setState({
                editing: false
              });
            };
          })(this),
          onKeyDown: (function(_this) {
            return function(e) {
              var _ref;
              if ((_ref = e.key) === 'Enter' || _ref === 'Escape') {
                return _this.setState({
                  editing: false
                });
              }
            };
          })(this),
          onChange: (function(_this) {
            return function(e) {
              return _this.props.onChange(e.target.value);
            };
          })(this)
        }
      ]) : _div([
        {
          onClick: (function(_this) {
            return function() {
              return _this.props.onClick();
            };
          })(this)
        }
      ], PlaceholderTextComponent({
        placeholder: coursePlaceholder
      }, this.props.title)), this.props.editable ? this.state.editing ? _i([
        'sidebar-course-title-edit-icon icon-pencil', {
          key: 'edit-button-editing'
        }
      ]) : _i([
        'sidebar-course-title-edit-icon icon-pencil', {
          key: 'edit-button-not-editing',
          onClick: (function(_this) {
            return function() {
              return _this.setState({
                editing: true
              });
            };
          })(this)
        }
      ]) : void 0);
    },
    componentDidMount: function() {
      return this._afterRender();
    },
    componentDidUpdate: function(prevProps, prevState) {
      return this._afterRender();
    },
    _afterRender: function() {
      if (this.state.editing) {
        return this.refs.input.getDOMNode().focus();
      }
    }
  });

  SidebarDropdownComponent = React.createClass({
    getInitialState: function() {
      return {
        opened: false
      };
    },
    _onDocumentClick: function(e) {
      if (this.getDOMNode().contains(e.target)) {
        return;
      }
      return this.setState({
        opened: false
      });
    },
    componentDidMount: function() {
      return document.addEventListener('click', this._onDocumentClick, true);
    },
    componentWillUnmount: function() {
      return document.removeEventListener('click', this._onDocumentClick, true);
    },
    render: function() {
      return _div([], _div([
        'sidebar-course-title-options-toggle', {
          onClick: (function(_this) {
            return function() {
              return _this.setState({
                opened: !_this.state.opened
              });
            };
          })(this)
        }
      ], this.state.opened ? _i(['icon-caret-up']) : _i(['icon-caret-down'])), this.state.opened ? _div(['sidebar-course-title-options-dropdown spec-sidebar-course-title-options-dropdown'], _div(['sidebar-course-title-options-dropdown-list'], this.props.children)) : void 0);
    }
  });

  TimeSinceComponent = React.createClass({
    _timeSince: function(date) {
      var diff, label, max, min, unit, unitCount, _i, _len, _ref, _ref1;
      diff = (+(new Date)) - date;
      if (diff <= 30 * 1000) {
        label = 'seconds';
      } else if ((30 * 1000 < diff && diff <= 60 * 1000)) {
        label = 'less than a minute';
      } else {
        _ref = [['minute', 60 * 1000, 60 * 60 * 1000], ['hour', 60 * 60 * 1000, 24 * 60 * 60 * 1000], ['day', 24 * 60 * 60 * 1000, Infinity]];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _ref1 = _ref[_i], unit = _ref1[0], min = _ref1[1], max = _ref1[2];
          if ((min < diff && diff <= max)) {
            unitCount = Math.floor(diff / min);
            label = "" + unitCount + " " + unit;
            if (unitCount > 1) {
              label += 's';
            }
          }
        }
      }
      return label;
    },
    componentDidMount: function() {
      return this._interval = setInterval(((function(_this) {
        return function() {
          return _this.forceUpdate();
        };
      })(this)), 10 * 1000);
    },
    componentWillUnmount: function() {
      return clearInterval(this._interval);
    },
    render: function() {
      return _span([], this._timeSince(this.props.date));
    }
  });

  return SidebarCourseComponent = React.createClass({
    getInitialState: function() {
      return {
        dragFromIndex: null,
        dragToIndex: null,
        hoveredId: null
      };
    },
    _addDropTargetToLessons: function(lessonComponents) {
      var newLessonComponents;
      newLessonComponents = lessonComponents.slice();
      if (this.state.dragToIndex != null) {
        newLessonComponents.splice(this.state.dragToIndex, 0, _div(['sidebar-lesson-drop-target']));
      }
      return newLessonComponents;
    },
    _draggingSomeLesson: function() {
      return this.state.dragFromIndex != null;
    },
    _renderLesson: function(lesson, lessonIndex) {
      var hasCompletedLesson, isCurrentLesson;
      hasCompletedLesson = lessonIndex < this.props.currentLessonIndex;
      isCurrentLesson = lessonIndex === this.props.currentLessonIndex;
      return SidebarLessonComponent({
        key: lesson.id,
        title: lesson.title,
        isAccessible: lesson.isAccessible,
        gadgets: lesson.gadgets,
        hovered: this.state.hoveredId === lesson.id,
        sectionGadgetType: this.props.sectionGadgetType,
        hasCompletedLesson: hasCompletedLesson && !this._draggingSomeLesson(),
        isCurrentLesson: isCurrentLesson && !this._draggingSomeLesson(),
        dragging: lessonIndex === this.state.dragFromIndex,
        currentGadgetIndex: this.props.currentGadgetIndex,
        editable: this.props.editable,
        onClick: (function(_this) {
          return function() {
            return _this.props.onClickLesson(lessonIndex);
          };
        })(this),
        onClickSection: (function(_this) {
          return function(gadgetIndex) {
            return _this.props.onClickSection(lessonIndex, gadgetIndex);
          };
        })(this),
        onChangeTitle: (function(_this) {
          return function(title) {
            return _this.props.onChangeLessonTitle(lessonIndex, title);
          };
        })(this),
        onDelete: (function(_this) {
          return function() {
            return _this.props.onLessonDelete(lessonIndex);
          };
        })(this),
        onDragStart: (function(_this) {
          return function() {
            return _this.setState({
              dragFromIndex: lessonIndex
            });
          };
        })(this),
        onDragMove: (function(_this) {
          return function(append) {
            if (_this.state.dragFromIndex == null) {
              return;
            }
            return _this.setState({
              dragToIndex: lessonIndex + (append ? 1 : 0)
            });
          };
        })(this),
        onDragEnd: (function(_this) {
          return function() {
            var dragFromId, dragToIndex;
            if (_this.state.dragFromIndex == null) {
              return;
            }
            dragFromId = _this.props.course.lessons[_this.state.dragFromIndex].id;
            dragToIndex = _this.state.dragToIndex;
            if (dragToIndex > _this.state.dragFromIndex) {
              dragToIndex--;
            }
            _this.props.onLessonMove(dragFromId, dragToIndex);
            return _this.setState({
              dragFromIndex: null,
              dragToIndex: null
            });
          };
        })(this),
        onHoverStart: (function(_this) {
          return function() {
            return _this.setState({
              hoveredId: lesson.id
            });
          };
        })(this),
        onHoverEnd: (function(_this) {
          return function() {
            return _this.setState({
              hoveredId: null
            });
          };
        })(this)
      });
    },
    _addLesson: function(e) {
      e.preventDefault();
      return this.props.onLessonAdd();
    },
    render: function() {
      return _div(['sidebar'], _div(['sidebar-course-title-container'], SidebarCourseTitleComponent({
        title: this.props.course.title,
        onClick: this.props.onClickCourseTitle,
        onChange: this.props.onChangeCourseTitle,
        editable: this.props.editable
      }), this.props.editable ? SidebarDropdownComponent({}, _div([], _b([], 'view as learner')), _div([], _a([
        {
          target: '_blank',
          href: this.props.siteBaseUrl + '/c/' + this.props.course.id + '/learn'
        }
      ], 'this revision')), this.props.course.isPublished ? _div([], _a([
        {
          target: '_blank',
          href: this.props.siteBaseUrl + '/c/' + this.props.course.id + '/learn?revision=true'
        }
      ], 'published course')) : void 0) : void 0), _div([
        'sidebar-body', 'sidebar-scrollbar', this._draggingSomeLesson() ? 'sidebar-dragging-some-lesson' : void 0, {
          style: {
            position: 'relative'
          }
        }
      ], _div([], this._addDropTargetToLessons(this.props.course.lessons.map(this._renderLesson))), this.props.editable ? _div(['sidebar-lesson'], _a([
        'sidebar-add-lesson', {
          onClick: this._addLesson
        }
      ], 'Add a lesson')) : void 0), this.props.editable ? _div(['sidebar-footer'], _div(['sidebar-last-saved'], TimeSinceComponent({
        date: this.props.lastSavedDateTime
      })), this.props.contributorsComponent ? _div(['sidebar-contributors'], this.props.contributorsComponent) : void 0) : void 0);
    },
    componentDidMount: function() {
      if (!this.getDOMNode().offsetParent) {
        return console.warn('Invariant violation: SidebarCourseComponent has no offsetParent, probably not attached to the DOM yet');
      }
    }
  });

}).call(this);


  return _bundleExports;
}));
