define(['cdn.underscore', 'text!./templates/template.html'], function(_, html) {
  var template = _.template(html);
  return function(){};
});
