var code = require('coffee-script').compile(require('fs').readFileSync('react-coffeescript-glue.coffee').toString(), {});

var options = {
  code: code,
  exports: 'ReactCoffeescriptGlue',
  dependencies: [{name: 'react', exports: 'React'},]
};

require('umd-wrap')(options, function(err, code) {
  console.log(code);
});
