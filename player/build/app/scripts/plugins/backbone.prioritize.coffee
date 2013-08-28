# Prioritize a collection -- bring models with given attributes to the top,
# in the preference order specified.
Backbone.Collection::prioritize = (qualities) ->
  for q in qualities.reverse()
    @remove model = @findWhere q
    @push model if model

