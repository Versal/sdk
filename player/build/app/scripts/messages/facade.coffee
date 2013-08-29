define [
  'cdn.backbone'
  'app/mediator'
], (Backbone, mediator) ->

  # Events that that should be handled locally (i.e., on loopback
  # within the facade and bound objects)
  locals = [
    'change'
    'configure'
    'configChange'
    'configEmpty'
    'doneEditing'
    'domReady'
    'domRemove'
    'save'
    'toggleEdit'
    'registerPropertySheet'
    'render' # DEPRECATE when we drop support in favor of domReady
    'cancelEditing'
  ]

  # A gadget-level event bus
  class Facade

    constructor: (options) ->
      @_model = options.model
      @_gadgetId = @_model.cid

      # Listen for gadget events at player level
      mediator.on "gadget:#{@_gadgetId}:change", (attributes) =>
        @event 'trigger', 'configChange', attributes

    event: (method, event, content, options) ->
      Backbone.Events[method].call @, event, content, options

    on: (args...) -> @event 'on', args...

    off: (args...) -> @event 'off', args...

    trigger: (event, content, opts = {}) ->
      options = _.extend {}, opts, gadgetId: @_gadgetId

      if event in locals
        @event 'trigger', event, content, options
      else
        # TODO: add some level of access control to the otherwise blind
        # pass-through.
        @event 'trigger', "local:#{event}", content, options
        mediator.trigger event, content, options

    assetUrl: (file) ->
      files = @_model.gadgetProject.get 'files'
      files[file]
