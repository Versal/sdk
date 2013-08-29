define [
  'cdn.marionette'
  'text!templates/author_sidebar/author_sidebar.html'
  'app/mediator'
  'plugins/tracker'
  './catalogue'
  'views/sidebar/sidebar'
  'cdn.jqueryui'
], (Marionette, template, mediator, tracker, SidebarCatalogueView, Sidebar) ->

  class AuthorSidebar extends Marionette.Layout
    _.extend @::, Sidebar
    _.extend @::, tracker('Author Sidebar')

    className: 'authorSidebar'

    template: _.template template

    initialize: ->
      $(document).ajaxComplete @onAjaxComplete

      @lastSavedTime = +(new Date())
      setInterval =>
        @updateSavedLabel()
      , 10*1000

    events:
      'click .js-publish': 'onPublishClick'
      'click .versal-logo': 'onLogoClick'

    regions:
      'catalogue': '.js-catalogue'

    ui:
      'lastSavedTime': '.timestamp'

    onRender: ->
      @catalogue.show new SidebarCatalogueView

    onAjaxComplete: =>
      @lastSavedTime = +(new Date)
      @updateSavedLabel()

    updateSavedLabel: ->
      diff = (+(new Date)) - @lastSavedTime

      label = "seconds" if (diff <= 30*1000)
      label = "less than a minute" if (30*1000 < diff <= 60*1000)

      for [unit, min, max] in [
        ["minute", 60*1000, 60*60*1000],
        ["hour", 60*60*1000, 24*60*60*1000],
        ["day", 24*60*60*1000, Infinity]
      ]
        if (min < diff <= max)
          unitCount = Math.floor(diff / min)
          label = "#{unitCount} #{unit}"
          label += "s" if unitCount > 1

      @ui.lastSavedTime.html label

    onPublishClick: ->
      mediator.trigger 'parent:notify', { event: "publishCourse" }
      @track 'Click Publish'

    templateHelpers: =>
      whitelabel: => @options.whitelabel
