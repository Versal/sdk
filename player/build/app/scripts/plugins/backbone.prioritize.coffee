define [
  'cdn.backbone'
], (Backbone) ->

  # NOTE at the time of this commit this is only used to kludge ordering of
  # gadgets. Due to potentially squirrelly behavior mentioned in TODO below
  # this should either be scrapped when the kludge goes away or if we begin
  # using it elsewhere we should re-evaluate the querying method.

  # Prioritize a collection -- bring models with given attributes to the top,
  # in the preference order specified.
  Backbone.Collection::prioritize = (qualities) ->
    for q in qualities.reverse()

      # TODO Re-evaluate this. If multiple elements in the collection match
      # qualities, we'll end up with some of them prioritized at the top of
      # the collection and others sprinkled throughout.
      @remove model = @findWhere q
      @push model if model
