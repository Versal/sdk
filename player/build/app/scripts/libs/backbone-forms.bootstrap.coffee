###
Include this template file after backbone-forms.amd.js to override the default templates

'data-*' attributes control where elements are placed
###
define ["cdn.jquery", "cdn.underscore", "cdn.backbone", "libs/backbone-forms"], ($, _, Backbone) ->
  Form = Backbone.Form

  ###
  Bootstrap templates for Backbone Forms
  ###

  Form.template = _.template """
    <form class="form" data-fieldsets></form>
  """

  Form.Fieldset.template = _.template """
    <fieldset class="bbf-fieldset" data-fields>
      <% if (legend) { %>
        <legend><%= legend %></legend>
      <% } %>
    </fieldset>
  """

  Form.Field.template = _.template """
    <div class="control-group field-<%= key %> bbf-field">
      <% if (this.options.schema.type === "Checkbox") { %>
        <div class="bbf-editor hacked-for-checkbox" data-editor><label class="control-label" for="<%= editorId %>"><%= title %></label></div>
        <div class="clearfix"></div>
      <% } else { %>
        <label class="control-label" for="<%= editorId %>"><%= title %></label>
        <div class="bbf-editor" data-editor></div>
      <% } %>
      <div class="bbf-error-tooltip-container">
        <div class="bff-error-tooltip versal-tooltip versal-tooltip-text versal-tooltip-left versal-tooltip-align-top">
          <div class="versal-tooltip-arrow"></div>
          <div class="bbf-error" data-error></div>
        </div>
      </div>
    </div>
  """

  Form.editors.Date.template = _.template """
    <div class="bbf-date">
      <select data-type="date" class="bbf-date"><%= dates %></select>
      <select data-type="month" class="bbf-month"><%= months %></select>
      <select data-type="year" class="bbf-year"><%= years %></select>
    </div>"""

  Form.editors.DateTime.template = _.template """
    <div class="bbf-datetime">
      <div class="bbf-date-container" data-date></div>
      <select data-type="hour" style="width: 4em"><%= hours %></select>
      :
      <select data-type="min" style="width: 4em"><%= mins %></select>
    </div>
  """

  Form.Field.errorClassName = "bbf-error"

#
#  Form.NestedField.template = _.template('\
#    <div class="field-<%= key %>">\
#      <div title="<%= title %>" class="input-xlarge">\
#        <span data-editor></span>\
#        <div class="help-inline" data-error></div>\
#      </div>\
#      <div class="help-block"><%= help %></div>\
#    </div>\
#  ');
#
#
#  Form.editors.List.template = _.template('\
#    <div class="bbf-list">\
#      <ul class="unstyled clearfix" data-items></ul>\
#      <button class="btn bbf-add" data-action="add">Add</button>\
#    </div>\
#  ');
#
#
#  Form.editors.List.Item.template = _.template('\
#    <li class="clearfix">\
#      <div class="pull-left" data-editor></div>\
#      <button type="button" class="btn bbf-del" data-action="remove">&times;</button>\
#    </li>\
#  ');
#
#
#  Form.editors.List.Object.template = Form.editors.List.NestedModel.template = _.template('\
#    <div class="bbf-list-modal"><%= summary %></div>\
#  ');
#
