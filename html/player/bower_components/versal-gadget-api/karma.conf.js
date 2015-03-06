module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'sinon'],
    basePath: '..',
    files: [
      'eventEmitter/EventEmitter.js',
      'versal-gadget-api/versal-player-api.js',
      {pattern: 'versal-gadget-api/test/test_gadget.html', included: false},
      'versal-gadget-api/test/versal-player-api-spec.coffee',

      'underscore/underscore.js',
      'versal-gadget-api/versal-challenges-api.js',
      'versal-gadget-api/test/versal-challenges-api-spec.js'
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    autoWatch: true,
    browsers: ['Firefox'],

    preprocessors: {
      '**/*.coffee': ['coffee']
    },

    coffeePreprocessor: {
      // options passed to the coffee compiler
      options: {
        bare: true,
        sourceMap: false
      },
      // transforming the filenames
      transformPath: function(path) {
        return path.replace(/\.coffee$/, '.js');
      }
    }
  });
};
