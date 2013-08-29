define [
  'cdn.marionette'
  'text!templates/loading.html'
], (Marionette, template) ->

  class LoadingView extends Marionette.ItemView
    className: 'loading-page'

    template: _.template template

    onRender: ->
      new vs.ui.LoadingIndicator @$('.spin-holder')

    hide: (cb) ->
      @$('.loading-overlay').fadeOut 400, =>
        cb?()
