_ = require 'underscore'
fs = require 'fs'
path = require 'path'
chalk = require 'chalk'
argv = require('optimist').argv
config = require('./config')()
signin = require './signin'
manifest = require './manifest'
pkg = require '../package.json'
create = require('./create')
preview = require('./preview')
localIp = require('./local-ip')()
upload = require('./upload')
version = require('./version')
codio = require('./codio')
# Legacy
compileIfLegacy = require('./compile').compileIfLegacy

if argv.env then config.env argv.env

logError = (err) ->
  console.error chalk.red(err)
  process.exit(1)

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
    if argv._.length == 0
      dirs = [process.cwd()]
    else
      dirs = argv._

    argv.port ?= 3000

    unless _.every(dirs, manifest.lookupManifest)
      return logError new Error 'preview is only allowed in gadget directories'

    preview dirs, argv, (err, projects) ->
      if err then return logError err

      localIpString = if localIp then " or http://#{localIp}:#{argv.port}" else ""
      console.log chalk.green("\\\\\\  ///  versal #{pkg.version}")
      console.log chalk.yellow(" \\\\\\///   http://localhost:#{argv.port}#{localIpString}")
      console.log chalk.red("  \\\\\\/    ctrl + C to stop")
      console.log ''
      projects.forEach (p) ->
        return unless p

        launcher = p.launcher || 'legacy'
        console.log chalk.grey("#{launcher} #{p.name}/@#{p.version}")

  signin: (argv) ->
    argv.authUrl ?= config.get 'authUrl'
    console.log "Signing in to #{argv.authUrl}"
    signin argv, (err, sessionId) ->
      if err then return logError err

      config.set 'sessionId', sessionId
      console.log chalk.green 'You have signed in successfully'
      if argv.verbose || argv.v then console.log sessionId

  upload: (argv) ->
    dir = argv._.shift() || process.cwd()

    unless manifest.lookupManifest dir
      return logError new Error 'preview is only allowed in gadget directories'

    # Legacy
    compileIfLegacy dir, (err) ->
      if err then console.error err
      else console.log chalk.green('compile legacy gadget, ok')

      manifest.readManifest dir, (err, manifest) ->
        if err then return logError err

        argv.apiUrl ?= config.get 'apiUrl'
        unless argv.sessionId
          argv.sessionId = argv.sid || config.get 'sessionId'

        if !argv.apiUrl then return console.log chalk.red('API url is undefined. Run versal signin.')
        if !argv.sessionId then return console.log chalk.red('Session ID is undefined. Run versal signin.')

        console.log("uploading #{manifest.name}@#{manifest.version} to #{argv.apiUrl}")

        upload dir, argv, (err, manifest) ->
          if err then return logError err
          console.log chalk.green("#{manifest.username}/#{manifest.name}/#{manifest.version} successfully uploaded")

  version: (argv) ->
    unless manifest.lookupManifest process.cwd()
      return logError new Error 'preview is only allowed in gadget directories'

    versionArg = argv._.shift()
    unless versionArg then return commands.help(argv)

    version versionArg, (err, oldVersion, newVersion) ->
      if err then return logError err
      message = "version bumped from v#{oldVersion} to v#{newVersion}"
      console.log chalk.green message

  codio: (argv) ->
    codio (err) ->
      if err then return logError err
      console.log chalk.green '.codio created'

command = argv._.shift() || 'help'
if typeof commands[command] != 'function'
  console.log 'Unknown command:', command
  command = 'help'

commands[command].call this, argv
