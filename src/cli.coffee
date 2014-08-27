path = require 'path'
chalk = require 'chalk'
argv = require('optimist').argv
signin = require './signin'
restapi = require './restapi'
manifest = require './manifest'
pkg = require '../package.json'
fs = require 'fs'
config = require('./config')()

if argv.env then config.env argv.env

logError = (err) -> console.error chalk.red(err)

commands =
  help: (argv) ->
    if argv.v || argv.version then return console.log pkg.version

    fs.readFile path.join(__dirname, '../usage.txt'), 'utf-8', (err, content) ->
      if err then return logError err
      content.split('\n').forEach (l) ->
        if l.indexOf('#') == 0
          console.log chalk.yellow l.slice(1)
        else
          console.log l

  create: (argv) ->
    create = require('./create')
    name = argv._.shift()

    create name, argv, (err) ->
      if err then return logError err
      console.log chalk.green(name + ' created. Have fun.')
      console.log chalk.grey('cd ' + name + ' && versal preview')

  config: (argv) ->
    cmd = argv._.shift()
    key = argv._.shift()
    value = argv._.shift()

    if cmd == 'get' then console.log config.get key
    if cmd == 'set'
      config.set key, value
      console.log key, value

  preview: (argv) ->
    preview = require('./preview')
    if argv._.length == 0
      dirs = [process.cwd()]
    else
      dirs = argv._

    argv.port ?= 3000

    preview dirs, argv, (err, projects) ->
      if err then return logError err

      localIp = require('./local-ip')()
      localIpString = if localIp then " or http://#{localIp}:#{argv.port}" else ""
      console.log chalk.green("\\\\\\  ///  versal #{pkg.version}")
      console.log chalk.yellow(" \\\\\\///   http://localhost:#{argv.port}#{localIpString}")
      console.log chalk.red("  \\\\\\/    ctrl + C to stop")
      console.log ''
      projects.forEach (p) ->
        return unless p

        launcher = p.launcher || 'legacy'
        console.log chalk.grey("#{launcher} #{p.name}/@#{p.version}")

  # Legacy
  compile: (argv) ->
    compile = require './compile'
    dir = argv._.shift() || process.cwd()

    compile dir, {}, (err) ->
      if err then console.error err
      else console.log chalk.green('compile ok')

  signin: (argv) ->
    signin.simpleSignin argv, (err) ->
      if err then return logError err

  upload: (argv) ->
    signin.addSessionToArgv argv, (err, argv) ->
      if err then return logError err

      upload = require('./upload')
      dir = argv._.shift() || process.cwd()

      manifest.readManifest dir, (err, manifest) ->
        if err then return logError err

        console.log("uploading #{manifest.name}@#{manifest.version} to #{argv.apiUrl}")

        restapi.getUserDetails argv, (err, user) ->
          if err then return logError err

          upload dir, argv, (err, manifest) ->
            if err then return logError err
            console.log chalk.green("#{manifest.username}/#{manifest.name}/#{manifest.version} successfully uploaded")

  codio: (argv) ->
    codio = require('./codio')
    codio (err) ->
      if err then return logError err
      console.log chalk.green '.codio created'

command = argv._.shift() || 'help'
if typeof commands[command] != 'function'
  console.log 'Unknown command:', command
  command = 'help'

commands[command].call this, argv
