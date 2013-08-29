define ['cdn.lodash', 'cdn.backbone'], (_, Backbone) ->

  class PropertySheetSchema extends Backbone.Model
    whiteListedAttributes:
      Text: []
      Number: []
      TextArea: []
      Checkbox: []
      Color: []
      Select: ['options']
      Radio: ['options']
      Checkboxes: ['options']
      Date: ['yearStart', 'yearEnd']
      DateTime: ['yearStart', 'yearEnd', 'minsInterval']
      Range: ['min', 'max', 'step']
      Tags: ['options', 'lowercase', 'duplicates', 'minLength', 'maxLength', 'updateAutoComplete']

    constantSchemaTop: ->
      conceptTags: {type: 'Tags', updateAutoComplete: true}

    sanitizedSchema: ->
      # Hide tags for Chili per issue #469
      # schema = @constantSchemaTop()
      schema = {}

      for name, attributes of @attributes
        unless schema[name]?
          sanitizedAttributes = @sanitizedAttributes(attributes)
          schema[name] = sanitizedAttributes if sanitizedAttributes?
      schema

    sanitizedAttributes: (attributes) ->
      return @sanitizedAttributes {type: attributes} if typeof attributes is 'string'
      return null unless typeof attributes is 'object'

      whiteListedAttributes = @whiteListedAttributes[attributes.type]
      return null unless whiteListedAttributes?

      _.pick(attributes, 'type', 'title', 'validators', whiteListedAttributes...)

    _defaultDefinitionForValue: (value) ->
      switch typeof value
        when 'boolean' then 'Checkbox'
        when 'number'  then 'Number'
        when 'string'
          if /^\#[a-f0-9]{6}$/i.test(value)
            'Color'
          else if value.length > 20
            'TextArea'
          else
            'Text'
        when 'object'
          if _.isArray(value) and _.every(value, (member) -> typeof member in ['string', 'number'])
            {type: 'Tags', options: _.uniq(value), updateAutoComplete: true}
          else
            null
        else
          null
