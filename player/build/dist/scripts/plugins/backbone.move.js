(function() {

  Backbone.Collection.prototype.move = function(model, toIndex) {
    var fromIndex;
    fromIndex = this.indexOf(model);
    if (fromIndex === -1) {
      throw new Error("Can't move a model that's not in the collection");
    }
    if (fromIndex !== toIndex) {
      this.models.splice(toIndex, 0, this.models.splice(fromIndex, 1)[0]);
    }
    return this.trigger('change');
  };

}).call(this);
