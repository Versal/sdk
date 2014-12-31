dragXOffset = 10

PlaceholderTextComponent = React.createClass
  render: ->
    text = @props.children.trim()

    if text
      _span [], text
    else
      _span ['sidebar-placeholder-text'],
        @props.placeholder

SidebarSectionComponent = React.createClass
  _onClick: (e) ->
    return unless @props.isAccessible
    @props.onClick()
    e.stopPropagation()

  render: ->
    _div [
      'sidebar-section-title'
      'sidebar-toc-progressed' if @props.hasCompletedSection || @props.isCurrentSection
      'sidebar-toc-active' if @props.isCurrentSection
      onClick: @_onClick
    ],
      @props.title

SidebarDragImageComponent = React.createClass
  _dragYOffset: ->
    if @isMounted()
      @getDOMNode().offsetHeight/2
    else
      0

  render: ->
    _div [
      'sidebar-lesson sidebar-lesson-drag-image'
      style:
        left: @props.x - dragXOffset
        top: @props.y - @_dragYOffset()
        width: @props.width
    ],
      _div ['sidebar-lesson-title'],
        _div ['sidebar-lesson-title-readonly'],
            PlaceholderTextComponent {placeholder: @props.placeholder},
              @props.title

RenderInBodyAdapter = React.createClass
  componentWillMount: ->
    @_elementInBody = document.createElement('div')
    document.body.appendChild @_elementInBody

  componentWillUnmount: ->
    React.unmountComponentAtNode @_elementInBody
    document.body.removeChild @_elementInBody

  render: -> _span()

  componentDidMount: ->
    @_renderElementInBody()

  componentDidUpdate: ->
    @_renderElementInBody()

  _renderElementInBody: ->
    React.renderComponent @props.children, @_elementInBody

SidebarLessonComponent = React.createClass
  _onClick: (e) ->
    return unless @props.isAccessible
    @props.onClick()
    e.stopPropagation()

  _renderSections: ->
    return @props.gadgets.map (gadget, gadgetIndex) =>
      return unless gadget.type == @props.sectionGadgetType
      trimmedTitle = (gadget.config.content || '').trim()
      return if trimmedTitle == ''

      return SidebarSectionComponent
        key: gadget.id
        title: trimmedTitle
        isAccessible: @props.isAccessible
        hasCompletedSection: @props.hasCompletedLesson || (@props.isCurrentLesson && gadgetIndex <= @props.currentGadgetIndex)
        isCurrentSection: @props.isCurrentLesson && gadgetIndex == @props.currentGadgetIndex
        onClick: => @props.onClickSection gadgetIndex

  getInitialState: ->
    editing: false
    dragImageContainer: null
    customDragImageX: null
    customDragImageY: null

  _onDragEnter: (e) ->
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

  _onDragOver: (e) ->
    e.preventDefault()
    relY = e.clientY - @getDOMNode().getBoundingClientRect().top
    height = @getDOMNode().offsetHeight / 2
    append = relY > height

    @props.onDragMove append

  _onDrag: (e) -> @setState customDragImageX: e.clientX, customDragImageY: e.clientY

  _onDragEnd: ->
    @setState
      renderCustomDragImage: false
      customDragImageX: null
      customDragImageY: null

  _onDrop: (e) -> e.preventDefault()

  _dragHandleOnDragStart: (e) ->
    e.dataTransfer.effectAllowed = 'move'

    e.dataTransfer.setData 'Text', @props.title

    if e.dataTransfer.setDragImage
      dragHandleY = @refs.title.getDOMNode().offsetHeight/2
      e.dataTransfer.setDragImage @getDOMNode(), dragXOffset, dragHandleY

      # Chrome/Firefox don't like hiding the component immediately so wait a tick (*sigh*).
      setTimeout @props.onDragStart, 0
    else
      # This will hide the component immediately so IE doesn't get a drag image.
      @props.onDragStart()
      @setState renderCustomDragImage: true

  _dragHandleOnDragEnd: ->
    @props.onDragEnd()

    # Needed for FF and IE
    @props.onHoverStart()
    setTimeout (=> @props.onHoverStart()), 50

  render: ->
    lessonPlaceholder = 'Untitled lesson'

    _div [
      'sidebar-lesson'
      'sidebar-lesson-disabled' unless @props.isAccessible
      'sidebar-lesson-editing' if @state.editing
      'sidebar-lesson-editable' if @props.editable
      'sidebar-lesson-hovered' if @props.hovered
      'sidebar-lesson-dragging' if @props.dragging
      'sidebar-toc-progressed' if @props.hasCompletedLesson || @props.isCurrentLesson
      'sidebar-toc-active' if @props.isCurrentLesson
      onClick: @_onClick
      onDragEnter: @_onDragEnter
      onDragOver: @_onDragOver
      onDrag: @_onDrag
      onDragEnd: @_onDragEnd
      onDrop: @_onDrop

      # This is necessary due to an unfortunate browser bug:
      # http://stackoverflow.com/questions/17946886/hover-sticks-to-element-on-drag-and-drop
      onMouseEnter: @props.onHoverStart
      onMouseMove: @props.onHoverStart
      onMouseLeave: @props.onHoverEnd
    ],
      if @props.editable
        _div [],
          _div [
            'sidebar-lesson-drag-handle'
            draggable: true
            onDragStart: @_dragHandleOnDragStart
            onDragEnd: @_dragHandleOnDragEnd
          ],
            _i ['icon-reorder']

          _div [
            'sidebar-lesson-delete-button'
            onClick: (e) -> e.stopPropagation()
            onMouseDown: (e) =>
              if confirm 'Are you sure you want to delete this lesson?'
                @props.onDelete()
          ],
            _i ['icon-remove']

          if @state.editing
            _div [
              'sidebar-lesson-edit-button'
              key: 'edit-button-editing'
              # do nothing, rely on input blur
            ],
              _i ['icon-pencil']
          else
            _div [
              'sidebar-lesson-edit-button'
              key: 'edit-button-not-editing'
              onClick: (e) =>
                e.stopPropagation()
                @setState editing: !@state.editing
            ],
              _i ['icon-pencil']

      _div ['sidebar-lesson-title', ref: 'title'],
        if @state.editing
          _input [
            'sidebar-lesson-title-input'
            value: @props.title
            ref: 'lessonTitleInput'
            placeholder: lessonPlaceholder
            onClick: (e) => e.stopPropagation()
            onBlur: => @setState editing: false
            onKeyDown: (e) => @setState editing: false if e.key in ['Enter', 'Escape']
            onChange: (e) => @props.onChangeTitle e.target.value
          ]
        else
          _div ['sidebar-lesson-title-readonly'],
            PlaceholderTextComponent {placeholder: lessonPlaceholder},
              @props.title
      _div [], @_renderSections()
      _i [
        'sidebar-lesson-lock icon-lock'
        title: 'This lesson is locked by one or more quizzes'
      ]

      if @state.renderCustomDragImage
        RenderInBodyAdapter {},
          SidebarDragImageComponent
            title: @props.title
            x: @state.customDragImageX
            y: @state.customDragImageY
            width: @getDOMNode()?.offsetWidth
            placeholder: lessonPlaceholder

  componentDidMount: ->
    @_afterRender false

  componentDidUpdate: (prevProps, prevState) ->
    @_afterRender prevProps.isCurrentLesson

  _afterRender: (prevIsCurrentLesson) ->
    unless @getDOMNode().offsetParent
      return console.warn 'Invariant violation: SidebarLessonComponent has no offsetParent, probably not attached to the DOM yet'
    unless @getDOMNode().offsetParent.className.match 'sidebar-body'
      return console.warn 'Invariant violation: SidebarLessonComponent offsetParent is not the sidebar body!'
    if @props.isCurrentLesson && !prevIsCurrentLesson
      scrollContainer = @getDOMNode().offsetParent
      # Scroll lesson into the middle of the sidebar body, if not already visible.
      unless scrollContainer.scrollTop <= @getDOMNode().offsetTop <= scrollContainer.scrollTop + scrollContainer.offsetHeight
        scrollContainer.scrollTop = @getDOMNode().offsetTop - scrollContainer.offsetHeight/2
    if @state.editing
      @refs.lessonTitleInput.getDOMNode().focus()

SidebarCourseTitleComponent = React.createClass
  getInitialState: ->
    editing: false

  render: ->
    coursePlaceholder = 'Untitled course'

    _div ['sidebar-course-title'],
      if @state.editing
        _input [
          'sidebar-course-title-input'
          value: @props.title
          ref: 'input'
          placeholder: coursePlaceholder
          onBlur: => @setState editing: false
          onKeyDown: (e) => @setState editing: false if e.key in ['Enter', 'Escape']
          onChange: (e) => @props.onChange e.target.value
        ]
      else
        _div [onClick: => @props.onClick()],
          PlaceholderTextComponent {placeholder: coursePlaceholder},
            @props.title

      if @props.editable
        if @state.editing
          _i [
            'sidebar-course-title-edit-icon icon-pencil'
            key: 'edit-button-editing'
          ]
        else
          _i [
            'sidebar-course-title-edit-icon icon-pencil'
            key: 'edit-button-not-editing'
            onClick: => @setState editing: true
          ]

  componentDidMount: ->
    @_afterRender()

  componentDidUpdate: (prevProps, prevState) ->
    @_afterRender()

  _afterRender: ->
    if @state.editing
      @refs.input.getDOMNode().focus()


SidebarDropdownComponent = React.createClass
  getInitialState: ->
    opened: false

  _onDocumentClick: (e) ->
    return if @getDOMNode().contains e.target

    @setState opened: false

  componentDidMount: ->
    document.addEventListener 'click', @_onDocumentClick, true # true: capture

  componentWillUnmount: ->
    document.removeEventListener 'click', @_onDocumentClick, true

  render: ->
    _div [],
      _div ['sidebar-course-title-options-toggle', onClick: => @setState opened: !@state.opened],
        if @state.opened
          _i ['icon-caret-up'],
        else
          _i ['icon-caret-down']

      if @state.opened
        _div ['sidebar-course-title-options-dropdown spec-sidebar-course-title-options-dropdown'],
          _div ['sidebar-course-title-options-dropdown-list'],
            @props.children


TimeSinceComponent = React.createClass
  _timeSince: (date) ->
    diff = (+(new Date)) - date
    if diff <= 30*1000
      label = 'seconds'
    else if 30*1000 < diff <= 60*1000
      label = 'less than a minute'
    else
      for [unit, min, max] in [
        ['minute', 60*1000, 60*60*1000],
        ['hour', 60*60*1000, 24*60*60*1000],
        ['day', 24*60*60*1000, Infinity]
      ]
        if (min < diff <= max)
          unitCount = Math.floor(diff / min)
          label = "#{unitCount} #{unit}"
          label += 's' if unitCount > 1
    label

  componentDidMount: ->
    @_interval = setInterval (=> @forceUpdate()), 10*1000

  componentWillUnmount: ->
    clearInterval @_interval

  render: ->
    _span [], @_timeSince @props.date


return SidebarCourseComponent = React.createClass
  getInitialState: ->
    dragFromIndex: null
    dragToIndex: null
    hoveredId: null

  _addDropTargetToLessons: (lessonComponents) ->
    newLessonComponents = lessonComponents.slice()
    if @state.dragToIndex?
      newLessonComponents.splice @state.dragToIndex, 0, _div ['sidebar-lesson-drop-target']
    newLessonComponents

  _draggingSomeLesson: -> @state.dragFromIndex?

  _renderLesson: (lesson, lessonIndex) ->
    hasCompletedLesson = lessonIndex < @props.currentLessonIndex
    isCurrentLesson = lessonIndex == @props.currentLessonIndex

    return SidebarLessonComponent
      key: lesson.id
      title: lesson.title
      isAccessible: lesson.isAccessible
      gadgets: lesson.gadgets
      hovered: @state.hoveredId == lesson.id
      sectionGadgetType: @props.sectionGadgetType
      hasCompletedLesson: hasCompletedLesson && !@_draggingSomeLesson()
      isCurrentLesson: isCurrentLesson && !@_draggingSomeLesson()
      dragging: lessonIndex == @state.dragFromIndex
      currentGadgetIndex: @props.currentGadgetIndex
      editable: @props.editable
      onClick: => @props.onClickLesson lessonIndex
      onClickSection: (gadgetIndex) => @props.onClickSection lessonIndex, gadgetIndex
      onChangeTitle: (title) => @props.onChangeLessonTitle lessonIndex, title
      onDelete: => @props.onLessonDelete lessonIndex
      onDragStart: => @setState dragFromIndex: lessonIndex
      onDragMove: (append) =>
        return unless @state.dragFromIndex?
        @setState dragToIndex: lessonIndex + (if append then 1 else 0)
      onDragEnd: =>
        return unless @state.dragFromIndex?
        dragFromId = @props.course.lessons[@state.dragFromIndex].id
        dragToIndex = @state.dragToIndex
        if dragToIndex > @state.dragFromIndex then dragToIndex-- # don't count the old lesson
        @props.onLessonMove(dragFromId, dragToIndex)
        @setState dragFromIndex: null, dragToIndex: null
      onHoverStart: => @setState hoveredId: lesson.id
      onHoverEnd: => @setState hoveredId: null

  _addLesson: (e) ->
    e.preventDefault()
    @props.onLessonAdd()

  render: ->
    _div ['sidebar'],
      _div ['sidebar-course-title-container'],
        SidebarCourseTitleComponent
          title: @props.course.title
          onClick: @props.onClickCourseTitle
          onChange: @props.onChangeCourseTitle
          editable: @props.editable

        if @props.editable
          SidebarDropdownComponent {},
            _div [], _b [], 'view as learner'
            _div [], _a [
              target: '_blank'
              href: @props.siteBaseUrl + '/c/' + @props.course.id + '/learn'
            ],
              'this revision'
            if @props.course.isPublished
              _div [], _a [
                target: '_blank'
                href: @props.siteBaseUrl + '/c/' + @props.course.id + '/learn?revision=true'
              ],
                'published course'

      _div [
        'sidebar-body'
        'sidebar-scrollbar'
        'sidebar-dragging-some-lesson' if @_draggingSomeLesson()
        style: {position: 'relative'} # for finding offsetParent in lesson
      ],
        _div [], @_addDropTargetToLessons @props.course.lessons.map(@_renderLesson)

        if @props.editable
          _div ['sidebar-lesson'],
            _a ['sidebar-add-lesson', onClick: @_addLesson],
              'Add a lesson'

      if @props.editable
        _div ['sidebar-footer'],
          _div ['sidebar-last-saved'],
            TimeSinceComponent date: @props.lastSavedDateTime

          if @props.contributorsComponent
            _div ['sidebar-contributors'], @props.contributorsComponent

  componentDidMount: ->
    unless @getDOMNode().offsetParent
      return console.warn 'Invariant violation: SidebarCourseComponent has no offsetParent, probably not attached to the DOM yet'
