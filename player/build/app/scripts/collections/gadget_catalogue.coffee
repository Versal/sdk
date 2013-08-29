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
      @find (gadget) -> gadget.get('type') == type

    buildInstanceOfType: (type, opts) ->
      unless gadget = @findGadgetByType type
        throw new vs.api.errors.ApplicationError "Unknown gadget type #{type}"
      instance = new vs.api.GadgetInstance
      instance.gadgetProject = gadget
      instance.set type: type
      instance

