module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      'bower_components/versal-component-runtime/dist/runtime.min.js',

      // Iframe launcher
      'iframe-launcher/iframe-launcher.html',
      'iframe-launcher/test/*_spec.js',
      {pattern: 'iframe-launcher/iframe-launcher.js', included: false},
      {pattern: 'iframe-launcher/test/test_gadget.html', included: false},

      // Legacy launcher
      'bower_components/underscore/underscore.js',
      'bower_components/backbone/backbone.js',
      'bower_components/jquery/dist/jquery.js',
      {pattern: 'legacy-launcher/test_gadget/gadget.css', included: false},
      'legacy-launcher/mini_require.js',
      'legacy-launcher/legacy-launcher.html',
      {pattern: 'legacy-launcher/legacy-launcher.js', included: false},
      'legacy-launcher/legacy-launcher_spec.js'
    ],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    autoWatch: true,
    browsers: ['Firefox']
  });
};
