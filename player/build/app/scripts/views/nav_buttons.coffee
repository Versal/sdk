define [
  'cdn.marionette'
  'text!templates/nav-buttons.html'
  'app/mediator'
  'plugins/tracker'
], (Marionette, template, mediator, tracker) ->

  class NavButtonsView extends Marionette.CompositeView
    _.extend @::, tracker('Navigation Buttons')

    className: 'nav-buttons'

    initialize: ->
      mediator.on 'lesson:rendered', @updateButtons, @

    onClose: ->
      mediator.off 'lesson:rendered', @updateButtons

    events:
      'click .js-prev': 'onPreviousClick'
      'click .js-next': 'onNextClick'
      'click .js-finish': 'onFinishClick'

    template: _.template template

    updateButtons: (@lessonView) ->
      model = @lessonView.model

      @prev = @model.lessons.at @model.lessons.indexOf(model) - 1
      @next = @model.lessons.at @model.lessons.indexOf(model) + 1

      @lessonView.on 'userStateSync', @render, @
      @next.on 'change', @render, @ if @next

      @_prevLessonView.off 'userStateSync', @render if @_prevLessonView
      @_prevNext.off 'change', @render if @_prevNext
      @_prevLessonView = @lessonView
      @_prevNext = @next

      @render()

    onPreviousClick: ->
      destination = 1 + @model.lessons.indexOf @prev
      mediator.trigger 'lesson:navigate', destination
      @track 'Click Previous', { lesson: @model.id, destination }

    onNextClick: ->
      destination = 1 + @model.lessons.indexOf @next
      mediator.trigger 'lesson:navigate', destination
      @track 'Click Next', { lesson: @model.id, destination }

    onFinishClick: ->
      mediator.trigger 'parent:notify', { event: 'courseEnd' }
      @track 'Click Finish', { lesson: @model.id }

    previousAvailable: => @prev? && (@prev.get('isAccessible') || @model.get('isEditable'))

    nextAvailable: => @next? && (@next.get('isAccessible') || @model.get('isEditable'))

    isComplete: => @lessonView?.isComplete() && !@next

    buttonIf: (criterion, classname, content) =>
      "<a class='#{classname}'><span class='nav-button-text'>#{content}</span><i></i></a>" if criterion

    templateHelpers: => {
      @previousAvailable
      @nextAvailable
      @isComplete
      @buttonIf
    }
