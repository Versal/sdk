
/*
Include this template file after backbone-forms.amd.js to override the default templates

'data-*' attributes control where elements are placed
*/


(function() {

  define(["cdn.jquery", "cdn.underscore", "cdn.backbone", "libs/backbone-forms"], function($, _, Backbone) {
    var Form;
    Form = Backbone.Form;
    /*
      Bootstrap templates for Backbone Forms
    */

    Form.template = _.template("<form class=\"form\" data-fieldsets></form>");
    Form.Fieldset.template = _.template("<fieldset class=\"bbf-fieldset\" data-fields>\n  <% if (legend) { %>\n    <legend><%= legend %></legend>\n  <% } %>\n</fieldset>");
    Form.Field.template = _.template("<div class=\"control-group field-<%= key %> bbf-field\">\n  <% if (this.options.schema.type === \"Checkbox\") { %>\n    <div class=\"bbf-editor hacked-for-checkbox\" data-editor><label class=\"control-label\" for=\"<%= editorId %>\"><%= title %></label></div>\n    <div class=\"clearfix\"></div>\n  <% } else { %>\n    <label class=\"control-label\" for=\"<%= editorId %>\"><%= title %></label>\n    <div class=\"bbf-editor\" data-editor></div>\n  <% } %>\n  <div class=\"bbf-error-tooltip-container\">\n    <div class=\"bff-error-tooltip versal-tooltip versal-tooltip-text versal-tooltip-left versal-tooltip-align-top\">\n      <div class=\"versal-tooltip-arrow\"></div>\n      <div class=\"bbf-error\" data-error></div>\n    </div>\n  </div>\n</div>");
    Form.editors.Date.template = _.template("<div class=\"bbf-date\">\n  <select data-type=\"date\" class=\"bbf-date\"><%= dates %></select>\n  <select data-type=\"month\" class=\"bbf-month\"><%= months %></select>\n  <select data-type=\"year\" class=\"bbf-year\"><%= years %></select>\n</div>");
    Form.editors.DateTime.template = _.template("<div class=\"bbf-datetime\">\n  <div class=\"bbf-date-container\" data-date></div>\n  <select data-type=\"hour\" style=\"width: 4em\"><%= hours %></select>\n  :\n  <select data-type=\"min\" style=\"width: 4em\"><%= mins %></select>\n</div>");
    return Form.Field.errorClassName = "bbf-error";
  });

}).call(this);
