"use strict"

path = require "path"
middleware = require "./dev_middleware"
configure = require "./tasks/helpers/config"
require "./tasks/configure_stubbing"

module.exports = (grunt) ->
  registerLibs = undefined
  libsConfig = undefined

  # load all grunt tasks
  require("matchdep").filterDev("grunt-*").forEach grunt.loadNpmTasks
  grunt.loadNpmTasks "grunt-contrib-stylus"

  # This is some pretty hacky stuff to pull out the shared-libs
  # config for a dist compilation. TODO export submodule configs as JSON
  # and figure out a better way around this!
  global.define = (deps, method) ->
    registerLibs = method()

  require "./app/scripts/shared-libs/config"
  libsConfig = registerLibs "shared-libs"

  serverPort = grunt.option('port') || 3232
  userConfigPath = grunt.option 'config'
  defaultConfigPath = path.join __dirname, 'app/config.json'
  indexTemplatePath = path.join __dirname, 'app/index.html.tmpl'

  config = configure userConfigPath, defaultConfigPath
  grunt.option 'config', config

  grunt.initConfig
    watch:
      test:
        files: [
          "app/**/*.coffee"
          "app/**/*.js"
          "app/**/*.html"
          "test/**/*"
        ]
        tasks: [
          "coffee"
          "copy:test"
          "copy:dist"
          "mocha"
        ]

      stylus:
        files: [
          "app/styles/vendor/**/*.styl"
          "app/styles/**/*.styl"
        ]
        tasks: [
          "stylus"
        ]

      assets:
        files: ["app/assets/**/*"]
        tasks: ["copy:assets"]

    connect:
      er:
        options:
          port: serverPort
          hostname: "0.0.0.0"
          middleware: (connect) -> [
            middleware.cssRewriter()
            middleware.serveIndex indexTemplatePath, config
            middleware.mountFolder connect, "dist"
          ]

    open:
      server:
        url: "http://localhost:<%= connect.er.options.port %>"

    clean:
      dist: ["dist/*"]

    mocha:
      all:
        options:
          urls: ["http://localhost:<%= connect.er.options.port %>/test"]
          reporter: 'Spec',
          log: true

    stylus:
      compile:
        options:
          import: ['app/styles/variables.styl','nib']

        # options would go here
        files: [
          "dist/styles/main.css": [
            "app/styles/vendor/**/*.styl"
            "app/styles/base.styl"
            "app/styles/gadgets/**/*.styl"
            "app/styles/*.styl"
          ]
        ]

    cssmin:
      compile:
        expand: true
        files:
          "dist/styles/player-bundle.css": [
            "dist/styles/vendor/jquery-ui.css"
            "dist/styles/vendor/bootstrap.css"
            "dist/styles/vendor/font-awesome.css"
            "dist/styles/vendor/spectrum.css"
            "dist/styles/vendor/clayer.css"
            "dist/styles/vendor/tooltips.css"
            "dist/styles/vendor/tags.css"
            "dist/styles/main.css"
          ]

    coffee:
      dist:
        expand: true
        cwd: "app/"
        src: ["**/*.coffee"]
        dest: "dist/"
        rename: (path, name) ->
          path + name.replace(/([^.]*)$/, "js")

      test:
        expand: true
        cwd: "test/"
        src: ["**/*.*coffee"]
        dest: "dist/test/"
        rename: (path, name) ->
          path + name.replace(/([^.]*)$/, "js")

    requirejs:
      dist:
        options:
          include: [
            "player"
            "launcher"
          ]
          baseUrl: "dist/scripts"
          mainConfigFile: "dist/scripts/config.js"
          optimize: "uglify"
          wrap: false
          out: "dist/scripts/player-bundle.js"
          shim: libsConfig.shim
          paths: libsConfig.paths
          exclude: [
            "cdn.jquery"
            "cdn.backbone"
            "cdn.marionette"
            "cdn.lodash"
            "cdn.jqueryui"
            "cdn.raphael"
            "cdn.underscore"
            "cdn.mathjax"
            "cdn.processing"
          ]

    copy:
      dist:
        files: [
          expand: true
          dot: true
          cwd: "app"
          dest: "dist"
          src: [
            "**/*.{ico,txt,html,css}"
            "!index.html"
          ]
        ,
          expand: true
          cwd: "app"
          dest: "dist"
          src: ["scripts/**/*.js"]
        ]


      #TODO: Replace with something more generic
      toc:
        expand: true
        cwd: "app/toc"
        src: ["**/*.png"]
        dest: "dist/toc"

      test:
        expand: true
        cwd: "test"
        src: ["**"]
        dest: "dist/test/"

      assets:
        files: [
          expand: true
          cwd: "app/assets/"
          src: ["**"]
          dest: "dist/assets/"
        ]

      # `asset-stubs` provides prebaked asset json for testing stubbed asset
      # picker in player (and sdk). This copies them into place.
      stubs:
        files: [
          expand: true
          cwd: "node_modules/asset-stubs/stubs/player/fixtures"
          dest: "dist/scripts/views/stubbed/asset_picker"
          src: ["*.json"]
        ]

  grunt.registerTask "server", [
    "test"
    "watch"
  ]

  grunt.registerTask "reset", [
    "clean"
    "copy"
    "coffee"
    "stylus"
    "configure-stubbing"
  ]

  grunt.registerTask "test", [
    "reset"
    "connect:er"
    "mocha"
  ]

  grunt.registerTask "build", [
    "test"
    "cssmin"
    "requirejs"
  ]

  grunt.registerTask "default", ["server"]
