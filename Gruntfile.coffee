module.exports = (grunt) ->
  # Load all grunt-* related tasks
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      temp: 'temp/*'

    mochaTest:
      test:
        src: ['test/**/*_spec.coffee']
        options:
          timeout: 7300
          reporter: 'spec'

    exec:
      "build-docs":
        command: 'cd ../gadget-docs && ' +
                 'git checkout master && ' +
                 'git pull && ' +
                 'npm install && ' +
                 'grunt && ' +
                 'cd - && ' +
                 'rm -rf ./docs &&' +
                 'cp -r ../gadget-docs/dist ./docs && ' +
                 'echo Done.'

      "build-player":
        command: 'cd ../player && ' +
                 'git checkout master && ' +
                 'git pull && ' +
                 'npm install && ' +
                 'grunt build && ' +
                 'cd - && ' +
                 'rm -rf ./preview/player.js ./preview/main.css ./preview/vendor ./preview/assets/font ./preview/assets/img && ' +
                 'cp ../player/dist/scripts/player-bundle.js ./preview/player.js && ' +
                 'cp -r ../player/dist/styles/main.css ./preview/main.css && ' +
                 'cp -r ../player/dist/styles/vendor ./preview/vendor && ' +
                 'cp -r ../player/dist/assets/img ./preview/assets/img && ' +
                 'cp -r ../player/dist/assets/font ./preview/assets/font && ' +
                 'echo Done.'

  grunt.registerTask 'default', ['clean', 'mochaTest']
