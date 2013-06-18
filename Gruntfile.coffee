module.exports = (grunt) ->
  # Load all grunt-* related tasks
  require('matchdep').filterDev('grunt-*').forEach grunt.loadNpmTasks

  grunt.initConfig
    clean:
      temp: 'temp/*'
      lib: 'lib/*'

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
      test:
        src: ['temp/test/**/*_spec.js']
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
                 'rm -rf ../tmp-docs'

  grunt.registerTask 'default', ['clean', 'coffee', 'mochaTest']
