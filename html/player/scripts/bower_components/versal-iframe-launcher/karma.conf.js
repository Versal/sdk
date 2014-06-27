module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      'bower_components/versal-component-runtime/dist/runtime.min.js',
      'index.html',
      'test/*_spec.js',
      {pattern: 'index.js', included: false},
      {pattern: 'test/test_gadget.html', included: false}
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    autoWatch: true,
    browsers: ['Firefox']
  });
};
