define [
  'views/inline_catalogue'
], (InlineCatalogueView) ->
  (el, shownCallback, hiddenCallback) ->

    catalogue = new InlineCatalogueView
    el.html catalogue.render().el
    shownCallback catalogue

    catalogue.on 'selectCanceled', =>
      catalogue.remove()
      hiddenCallback catalogue
