define ["cdn.jquery", "cdn.marionette", "text!./student.html", "text!./author.html", "cdn.jqueryui", "app/mediator"], ($, Marionette, studentTemplate, authorTemplate, jqueryUI, mediator) ->
  delay = (ms, func) -> setTimeout func, ms

  class TableOfContentsView extends Marionette.View
    template: ->
      if @model.get('isEditable') then _.template(authorTemplate) else _.template(studentTemplate)

    events:
      'click .js-create-lesson'   : 'createLesson'
      'click .js-destroy-lesson'  : 'destroyLesson'
      'dblclick .js-rename-lesson': 'enableLesson'
      'click .js-navigate-lesson' : 'selectLesson'
      'change .js-rename-lesson'  : 'renameLesson'
      'blur .js-rename-lesson'    : 'disableLesson'
      'focus .js-rename-lesson'   : 'blurLesson'

    isEditable: ->
      return @model.get 'isEditable'

    initialize: (options) ->
      @model.lessons.on 'change:title', @render, @
      @model.lessons.on 'add reset', @render, @
      @model.lessons.on 'remove', @lessonRemoved, @

      triggerHide = -> mediator.trigger 'toc:hide'

      # Listen to global mediator events
      mediator.on 'toc:toggle', =>
        $toc = @$el.parent()
        if $toc.is(':visible') then mediator.trigger('toc:hide') else mediator.trigger('toc:show')

      mediator.on 'toc:show', =>
        @$el.parent().stop().fadeIn 'fast', ->
          $(window).one 'mousedown', triggerHide
          $(this).on 'mousedown', (e) -> e.stopPropagation()

      mediator.on 'toc:hide', =>
        @$el.parent().stop().fadeOut 'fast', -> $(window).off 'click', triggerHide

      mediator.on 'blocking:changed', =>
        @model.fetch
          success: @render

    render: ->
      @$el.html @template().call @, @serializeData()
      @$el.find('ul:first').sortable({ handle: '.handle', axis: 'y', containment: 'parent', tolerance: 'pointer' }).on 'sortupdate', @moveLesson

    serializeData: ->
      lessons = @model.lessons.map (lesson) ->
        _.extend lesson.toJSON(), cid: lesson.cid

      _.extend @model.toJSON(), lessons: lessons


    selectLesson: (e) =>
      target = $(e.currentTarget)
      lesson = @model.lessons.get target.data 'cid'
      return if !@isEditable() && lesson.get('isAccessible') == false

      target.addClass 'animated'
      target.addClass 'flash'

      mediator.trigger 'lesson:navigate', @model.lessons.indexOf(lesson) + 1
      delay 200, =>
        target.removeClass 'animated'
        target.removeClass 'flash'
        mediator.trigger 'toc:hide'

    disableLesson: (e) ->
      e.currentTarget.setAttribute 'readonly', 'readonly'

    enableLesson: (e) ->
      e.currentTarget.removeAttribute 'readonly'
      e.currentTarget.focus()
      e.stopPropagation()
      return false

    blurLesson: (e) ->
      e.currentTarget.blur() if e.currentTarget.getAttribute('readonly')

    renameLesson: (e) =>
      return unless @isEditable()
      return unless e.currentTarget.value

      lesson = @model.lessons.get $(e.currentTarget.parentNode).data 'cid'
      lesson.save title: e.currentTarget.value

    moveLesson: (e, ui) =>
      return unless @isEditable()

      lesson = @model.lessons.get(ui.item.data('cid'))
      @model.lessons.move lesson, ui.item.index()

    createLesson: =>
      return unless @isEditable()
      @model.lessons.create {}

    destroyLesson: (e) =>
      e.stopPropagation()

      return false unless @isEditable()
      return false unless confirm('Are you sure you wish to delete this lesson?')

      cid = $(e.currentTarget.parentNode).data 'cid'
      @model.lessons.get(cid).destroy
        success: ->
          $(e.currentTarget).parents('li:first').fadeOut('fast', -> $(this).remove())
        error: (model, xhr)-> console.log 'error deleting lesson'


