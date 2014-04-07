path = require('path')
chalk = require('chalk')
argv = require('optimist').argv
config = require('./config')()
restapi = require('./restapi')
prompt = require('prompt')
pkg = require '../package.json'
fs = require 'fs'

if argv.env then config.env argv.env

commands =
  help: (argv) ->
    if argv.v || argv.version then return console.log pkg.version

    fs.readFile path.join(__dirname, '../usage.txt'), 'utf-8', (err, content) ->
      if err then return console.log chalk.red err
      content.split('\n').forEach (l) ->
        if l.indexOf('#') == 0
          console.log chalk.yellow l.slice(1)
        else
          console.log l

  create: (argv) ->
    create = require('./create')
    name = argv._.shift()

    create name, argv, (err) ->
      if err then return console.log chalk.red(err)
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

    preview dirs, (err, cnt, port) ->
      if err then return console.log chalk.red(err)
      console.log chalk.green("\\\\\\  ///  Versal SDK preview is started")
      console.log chalk.yellow(" \\\\\\///   ") + chalk.white("open http://localhost:#{port} in your favorite browser")
      console.log chalk.red("  \\\\\\/    ") + chalk.grey("ctrl + C to stop")

  signin: (argv) ->
    this.promptCredentials argv, (err, credentials) ->
      if err then return callback err
      credentials.authUrl = argv.authUrl || config.get 'authUrl'

      restapi.signin credentials, (err, sessionId) ->
        if err then return console.log chalk.red err
        config.set 'sessionId', sessionId
        console.log chalk.green 'You have signed in successfully'

  publish: (argv) ->
    publish = require('./publish')
    dir = argv._.shift() || process.cwd()

    argv.apiUrl ?= config.get 'apiUrl'
    argv.sessionId ?= config.get 'sessionId'

    if !argv.apiUrl then return console.log chalk.red('API url is undefined. Run versal signin.')
    if !argv.sessionId then return console.log chalk.red('Session ID is undefined. Run versal signin.')

    restapi.getUserDetails argv, (err, user) ->
      if err then return console.log chalk.red(err)

      publish dir, argv, (err, manifest) ->
        if err then return console.log chalk.red(err)
        console.log chalk.green("#{manifest.username}/#{manifest.name}/#{manifest.version} successfully published")

  promptCredentials: (options, callback) ->
    if options.email && options.password then return callback null, options

    prompt.message = ''
    prompt.delimiter = ''

    promptParams = [
      {
        name: "email"
        message: "Email address:"
        required: true
      }
      {
        name: "password"
        message: "Password:"
        required: true
        hidden: true
      }
    ]

    console.log 'Enter your Versal.com credentials to sign in:'
    prompt.get promptParams, callback

command = argv._.shift() || 'help'
if typeof commands[command] == 'function'
  commands[command](argv)
