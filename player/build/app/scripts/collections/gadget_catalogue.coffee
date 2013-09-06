define [
  'plugins/vs.api'
], ->

  class GadgetCatalogue extends vs.api.GadgetProjects
    initialize: ->
      super
      @_isReady = false
      @once 'sync', @onFirstSync, @

    isReady: ->
      @_isReady

    onFirstSync: ->
      unless @_isReady
        @_isReady = true
        @trigger 'ready'

    findGadgetByType: (type) ->
      # TODO: Deprecate this when player#841 is complete
      if type == 'gadget/section' then type = 'versal/section@0.2.9'
      @find (gadget) -> gadget.type() == type

    buildInstanceOfType: (type, opts) ->
      unless gadget = @findGadgetByType type
        throw new Error "Unknown gadget type #{type}"
      instance = new vs.api.GadgetInstance
      instance.gadgetProject = gadget
      instance.set type: type
      instance

