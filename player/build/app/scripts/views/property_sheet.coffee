define [
  'app/mediator'
  'plugins/tracker'
  'cdn.marionette'
  'text!templates/property_sheet.html'
  'libs/backbone-forms' # NOTE: we have our own repo for this
  'libs/backbone-forms.bootstrap' # NOTE: We have some custom templates here
  'views/backbone-forms/color'
  'views/backbone-forms/range'
  'views/backbone-forms/tags'
], (mediator, tracker, Marionette, template, Form) ->

  class PropertySheetView extends Marionette.ItemView
    _.extend @::, tracker('Property Sheet')

    template: _.template template

    className: 'properties-dialog'

    events:
      'change input[type=number]': 'onFormChange' # necessary due to a bug in Backbone.Form
      'submit .js-form' : 'doNothing'

    ui:
      form: '.js-form'
      errorCount: '.js-error-count'
      errorCountPlural: '.js-error-count-plural'
      errorCountContainer: '.js-error-count-container'

    initialize: ->
      @listenTo @options.config, 'change', @onConfigChange

    onConfigChange: (model, options) ->
      @render() unless options.propertySheetChanging
      @track 'Change Config',
        gadget: @options.model.id,
        changed: @options.config.changedAttributes()

    setErrorCount: (count) ->
      @ui.errorCount.text count
      @ui.errorCountPlural.toggle (count != 1)
      @ui.errorCountContainer.toggle (count > 0)

    onRender: ->
      @stopListening @form if @form?

      @form = new Form
        data: @options.config.toJSON()
        schema: @options.propertySheetSchema.sanitizedSchema()
      @form.render()

      errors = @form.validate()
      @setErrorCount _.size(errors)

      @listenTo @form, 'change', @onFormChange
      @ui.form.html @form.el

    doNothing: (e) ->
      e.preventDefault()

    onFormChange: ->
      @form.validate()

      # for now validations are only for UI, so we set properties regardless of them
      @options.config.save @form.getValue(), propertySheetChanging: true
