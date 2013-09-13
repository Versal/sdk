module.exports = (grunt) ->
  # Load all grunt-* related tasks
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      temp: 'temp'

    mochaTest:
      test:
        src: ['test/**/*_spec.coffee']
        options:
          timeout: 7300
          reporter: 'spec'

    watch:
      coffee:
        files: ['**/*.coffee']
        tasks: ['default']

    exec:
      "build-docs":
        command: './tasks/bin/build-docs.sh'

      "build-player":
        command: './tasks/bin/build-player.sh'

      "copy-player":
        command: './tasks/bin/copy-player.sh'

  grunt.registerTask 'default', ['clean', 'mochaTest']
  grunt.registerTask 'build-docs', ['exec:build-docs']
  grunt.registerTask 'build-player', ['exec:build-player']
