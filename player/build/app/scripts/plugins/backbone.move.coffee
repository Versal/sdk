Backbone.Collection::move = (model, toIndex) ->
  fromIndex = @indexOf model
  if fromIndex == -1
    throw new Error "Can't move a model that's not in the collection"

  if fromIndex != toIndex
    @models.splice toIndex, 0, @models.splice(fromIndex, 1)[0]

  @trigger 'change'
