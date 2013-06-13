/*
 * versal-cli
 * http://versal.com/
 *
 * Copyright (c) 2013 Versal Team
 */


'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/**/*.js',
        'bin/*',
      ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        node: true,
        es5: true
      }
    },
    exec: {
      "build-docs": {
        command: 'cp -r ./node_modules/versal-gadget-docs ./tmp-docs && ' +
                 'cd ./tmp-docs && ' +
                 'npm install && ' +
                 'grunt && ' +
                 'rm -rf ../lib/sdk/docs &&' +
                 'cp -r ./dist ../lib/sdk/docs && ' +
                 'rm -rf ../tmp-docs'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');

  // "npm test" runs these tasks
  grunt.registerTask('test', ['jshint']);

  // Default task.
  grunt.registerTask('default', ['test']);
};
