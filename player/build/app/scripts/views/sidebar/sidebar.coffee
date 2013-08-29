define [
  'app/mediator'
], (mediator) ->

  mixins =
    onLogoClick: ->
      mediator.trigger 'parent:notify', { event: 'logoClick' }
      @track 'Click Logo'
