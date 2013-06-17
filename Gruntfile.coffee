module.exports = (grunt) ->
  # Load all grunt-* related tasks
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      temp: 'temp/*'

    coffee:
      temp:
        expand: true,
        cwd: 'src/',
        src: '**/*.coffee',
        dest: 'lib/',
        ext: '.js'
      test:
        expand: true,
        cwd: 'test/',
        src: '**/*.coffee',
        dest: 'temp/test/',
        ext: '.js'

    mochaTest:
      files: ['temp/test/**/*_spec.js']
      options:
        timeout: 7300
        reporter: 'spec'

  grunt.registerTask 'default', ['clean', 'coffee', 'mochaTest']