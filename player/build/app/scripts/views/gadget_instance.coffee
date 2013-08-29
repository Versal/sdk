define [
  'cdn.marionette'
  'app/mediator'
  'plugins/tracker'
  'messages/facade'
  'views/property_sheet'
  'models/property_sheet_schema'
  'text!templates/gadget_instance.html'
  'text!templates/gadget_instance_error.html'
  'text!templates/gadget_delete_warn.html'
  'cdn.lodash'
], (Marionette, mediator, tracker, Facade, PropertySheetView, PropertySheetSchema, template, error_template, warn_template, _) ->

  class GadgetInstanceView extends Marionette.Layout
    _.extend @::, tracker('Gadget')

    template: _.template template

    className: 'gadget'

    regions:
      propertySheetRegion: '.js-property-dialog'

    events:
      'click .js-draggable':      'onDraggableClick'
      'click .js-edit':           'onEditClick'
      'click .js-trash':          'onTrashClick'
      'click .js-hide':           'onHideClick'
      'click .js-delete':         'onDeleteClick'
      'click .js-undo-delete':    'onUndoDelete'
      'dblclick':                 'onDblClick'
      'selectstart .js-placeholder': _.identity(false)

    ui:
      toolbar: '.toolbar'
      gadgetContent: '.gadgetContent'

    initialize: (options = {}) ->
      @isEditable = options.isEditable
      @listenTo @model, 'resolve:success', @onFetchSuccess, @
      @listenTo @model, 'resolve:error', @onFetchError, @

      @_facade = new Facade model: @model
      @_facade.on 'doneEditing', @onFacadeDoneEditing, @

      # TODO: remove when removing compatibility layer
      saveDebounced = _.debounce @saveGadgetConfig, 200

      @_facade.on 'registerPropertySheet', @onRegisterPropertySheet, @
      @_facade.on 'configChange', @onFacadeChange, @
      @_facade.on 'configEmpty', @onGadgetConfigEmpty, @
      @_facade.on 'save', saveDebounced, @
      @_facade.on 'cancelEditing', @onGadgetCancelEdit, @

      @listenTo @model, 'change', @onPropertiesChange
      @listenTo @model.config, 'change', @onGadgetConfigChange, @
      @listenTo @model, 'destroy', @onModelDestroy

      @_propertySheetSchema = new PropertySheetSchema

      @gadgetRendering = $.Deferred()
      @once 'gadgetRendered', => @gadgetRendering.resolve()

      @model.userState.on 'sync', => @trigger 'userStateSync'

    onInstanceAvailable: ->
      key = 'gadget-' + @model.gadgetProject.get('id')
      @ui.gadgetContent.addClass key

      @passEvent 'domReady'
      @passEvent 'render' # DEPRECATE when we drop support in favor of domReady
      @trigger 'gadgetRendered'

    onTrashClick: ->
      @toggleEdit false
      @showDeleteMsg()

    onHideClick: ->
      @$el.fadeOut 1200

    showDeleteMsg: ->
      return if @deleteShowing
      @deleteShowing = true
      height = @$el.height()
      warnMsg = $(warn_template)
      warnMsg.addClass('minimized') if height < 100
      @$el.append warnMsg

    onUndoDelete: ->
      @deleteShowing = false
      @$el.find('.js-alert-warn').remove()

    onDeleteClick: ->
      @track 'Destroy', { gadget: @model.id }
      @passEvent 'domRemove'
      @model.destroy()

    onDraggableClick: ->
      # Handled by sortable in LessonView for now

    onEditClick: (e) ->
      e.stopPropagation()
      @toggleEdit()

    onDblClick: (e) ->
      return unless @isEditable
      @trigger 'dblclick'
      @onEditClick(e) unless @_isEditing

    isChild: ->
      !!@model.config.get('_hidden')

    onPropertiesChange: (model, options) ->
      # TODO: remove when removing compatibility layer
      @passEvent 'configChange', @model.config.toJSON()

    onFacadeDoneEditing: () ->
      @toggleEdit false

    onFetchError: (err) =>
      @showCouldNotLoad err

    onFetchSuccess: (klass, options = {}) =>
      @instantiateGadget klass, options

    gadgetOptions: ->
       # TODO: When dropping the compatibility layer use options = {}
      options = @_facade

      options.player = @_facade
      options.el = @$('.gadgetContent')[0]
      options.propertySheetSchema = @_propertySheetSchema
      options.config = @model.config
      options.userState = @model.userState

      # This is used only in tekliner/survey gadget
      # TODO: Remove it when the forementioned gadget is fixed
      options.userStates = @model.userStates

      # Convenient attribute for when using Backbone.View (particularly when using Marionette)
      options.model  = @model.config

      # TODO: Remove this when dropping the compatibility layer
      options.facade = @_facade
      options.properties = @model.config
      options.properties.propertySheetSchema = @_propertySheetSchema
      options.$el = @$('.gadgetContent')

      options

    instantiateGadget: (klass, options = {}) ->
      defaultConfig = options.defaultConfig || {}
      defaultUserState = options.defaultUserState || {}
      noToggleSwitch = options.noToggleSwitch || false

      @model._gadgetKlass = klass
      @model.config.setDefaults _.cloneDeep defaultConfig
      @model.userState.setDefaults defaultUserState
      try
        options = @gadgetOptions()

        # TODO: Remove second and third arguments when dropping compatibility layer
        gadget = new klass(options, options.config.toJSON(), options.$el)

        @onInstanceAvailable()

        if @isEditable
          if noToggleSwitch
            # pass second 'onLoad' argument to indicate this is being called onLoad, not onDrop
            @passEvent 'toggleEdit', true, {onLoad:!@model.dropped}
            @$el.addClass('noToggleEdit').addClass('editing')
            @trigger 'gadgetRendered'
            @toggleEdit = (->)
          else if @model.dropped
            @toggleEdit true

      catch e
        @showCouldNotLoad("Couldn't initialize gadget")
        throw e

    onRender: ->
      @instantiateGadget @model._gadgetKlass if @model._gadgetKlass

    passEvent: (event, args...) ->
      if @model._gadgetKlass
        @_facade.trigger event, args...

    showCouldNotLoad: (errorDescription) ->
      @$el.html _.template error_template, { errorDescription }
      @trigger 'gadgetRendered'

    onRegisterPropertySheet: (schema) ->
      # TODO: remove when removing compatibility layer
      @_propertySheetSchema.clear silent: true
      @_propertySheetSchema.set schema

    showPropertySheet: ->
      return if @_propertySheetSchema.keys().length == 0
      unless @_propertySheetView
        @_propertySheetView = new PropertySheetView model: @model, config: @model.config, propertySheetSchema: @_propertySheetSchema
        @propertySheetRegion.show @_propertySheetView
      @_propertySheetView.$el.hide().show 'fast'

    hidePropertySheet: ->
      if @_propertySheetView
        @_propertySheetView.$el.hide()

    toggleEdit: (force) ->
      bool = _.isBoolean(force)
      return if bool and force == @_isEditing
      @_isEditing = if bool then force else !@_isEditing

      @track 'Toggle Editing', { editing: @_isEditing, gadget: @model.id }

      if @_isEditing
        @trigger 'edit', @
        @togglePropertySheet true
      else
        @togglePropertySheet false
        @trigger 'doneEditing', @
      @$el.toggleClass 'editing', @_isEditing
      @passEvent 'toggleEdit', @_isEditing
      @trigger 'gadgetRendered'

    toggleEmpty: (force) ->
      bool = _.isBoolean(force)
      return if bool and force == @_isEmpty
      @_isEmpty = if bool then force else !@_isEmpty
      @_emptyState = @model.config.toJSON() if @_isEmpty
      @$el.toggleClass 'empty', @_isEmpty

    showHoverables: (bool = true) ->
      elements = $().add @ui.toolbar
                    .add @ui.gadgetContent
                    .add @$el
      elements.toggleClass 'blocked', !bool

    togglePropertySheet: (force) ->
      bool = _.isBoolean(force)
      return if bool and force == @_configVisible
      @_configVisible = if bool then force else !@_configVisible
      if @_configVisible
        @toggleEdit true
        @showPropertySheet()
      else
        @hidePropertySheet()

    # TODO: remove when removing compatibility layer
    onFacadeChange: (attributes) ->
      # This is a little different from Backbone's "change" event in that
      # `attributes` only contains a list of *changed* attributes. This
      # may change as we backbonify our event model, but it's what it is
      # for now.
      @model.config.set attributes

    # TODO: remove when removing compatibility layer
    saveGadgetConfig: (attributes = {}) ->
      @model.config.save attributes

    onGadgetConfigChange: ->
      if @_emptyState && !_.isEqual @model.config.toJSON(), @_emptyState
        @toggleEmpty false

    onGadgetCancelEdit: ->
      @toggleEdit false

    onGadgetConfigEmpty: ->
      @toggleEmpty true

