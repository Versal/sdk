module.exports = (grunt) ->
  # Load all grunt-* related tasks
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      temp: 'temp/*'

    copy:
      fixtures:
        expand: true
        cwd: 'test/fixtures'
        src: '**/*.*'
        dest: 'temp/test/fixtures'

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
      specs: ['temp/test/**/*_spec.js']
    mochaTestConfig:
      options:
        timeout: 7300
        reporter: 'spec'

  grunt.registerTask 'default', ['clean', 'coffee', 'copy:fixtures', 'mochaTest:specs']