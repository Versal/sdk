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
        command: 'cp -r ./node_modules/versal-gadget-docs ./tmp-docs && ' +
                 'cd ./tmp-docs && ' +
                 'npm install && ' +
                 'grunt && ' +
                 'rm -rf ../docs &&' +
                 'cp -r ./dist ../docs && ' +
                 'rm -rf ../tmp-docs' +
                 'echo Done.'

      "build-player":
        command: 'cd ../player && ' +
                 'git checkout master && ' +
                 'git pull && ' +
                 'npm install && ' +
                 'grunt build && ' +
                 'cd - && ' +
                 'rm -rf ./preview/player.js ./preview/main.css ./preview/vendor && ' +
                 'cp ../player/dist/scripts/player-bundle.js ./preview/player.js && ' +
                 'cp -r ../player/dist/styles/main.css ./preview/main.css && ' +
                 'cp -r ../player/dist/styles/vendor ./preview/vendor && ' +
                 'echo Done.'

  grunt.registerTask 'default', ['clean', 'mochaTest']
