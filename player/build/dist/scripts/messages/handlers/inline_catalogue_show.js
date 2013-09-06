(function() {

  define(['views/inline_catalogue'], function(InlineCatalogueView) {
    return function(el, shownCallback, hiddenCallback) {
      var catalogue,
        _this = this;
      catalogue = new InlineCatalogueView;
      el.html(catalogue.render().el);
      shownCallback(catalogue);
      return catalogue.on('selectCanceled', function() {
        catalogue.remove();
        return hiddenCallback(catalogue);
      });
    };
  });

}).call(this);
