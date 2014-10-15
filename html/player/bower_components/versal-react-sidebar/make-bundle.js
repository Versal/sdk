var code = require('coffee-script').compile(require('fs').readFileSync('sidebar.coffee').toString(), {});

var options = {
  code: code,
  exports: 'SidebarCourseComponent',
  dependencies: [{name: 'react', exports: 'React'}, {name: 'react-coffeescript-glue', exports: 'ReactCoffeescriptGlue'}]
};

require('umd-wrap')(options, function(err, code) {
  console.log(code);
});
