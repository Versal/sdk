_ = require 'lodash'

# Commands that are displayed in cli help
commands = [
  'create'
  'preview'
  'publish'
  'help'
  'install'
]

# Debug commands are not displayed in cli help, but still runnable
debugCommands = [
  'compile'
  'compress'
  'signin'
  'upload'
  'validate'
  'docs'
  'gadgets'
]

commandsString = commands.join ' | '
usageMessage = [
  'Versal SDK. Supported commands:'
  '  versal create gadget <name> - creates a gadget'
  '  versal preview (<dir>) - previews gadget in <dir> or current directory'
  '  versal publish (<dir>) - publishes gadget in <dir> or current directory'
  '  versal help - starts web server with documentation on port 4000'
].join '\n'

argv = require('optimist')
  .usage(usageMessage)
  .demand(0)
  .check((argv) ->
    if argv.version
      packageInfo = require('../package.json')
      console.log packageInfo.version
      process.exit()

    if !argv._.length
      throw new Error 'command has not been specified'

    command = argv._[0]
    # alias 'help' -> 'docs'
    if command == 'help' then argv._[0] = 'docs'

    if !_.contains(commands.concat(debugCommands), command)
      throw new Error "invalid command: #{command}"

    # FIXME: It's time to generalize this
    # special case for "create" command - it requires second argument
    # Second argument must be either "gadget" or "course"
    if command == 'create'
      if argv._.length == 1 || not(_.contains(['gadget','course'], argv._[1]))
        # show usage information
        throw new Error [
          '"create" command requires second argument: "versal create (gadget|course) <dir> [--options]'
          'Examples:\n\tversal create gadget chemistry-gadget'
          '\tversal create course chemistry-course'
        ].join '\n'

    # another special case for "gadgets" command
    # second argument must be "approve" or "reject"
    if command == 'gadgets'
      if argv._.length == 1 || not(_.contains(['approve','reject'], argv._[1]))
        # show usage information
        throw new Error '"gagdets" command requires second argument: "versal gadgets (approve|reject) <id|type>"'
      if argv._.length == 2
        throw new Error "\"gadgets #{argv._[1]}\" requires id or type of the gadget to #{argv._[1]}"

    return true
  ).argv

sdk = require '../src/sdk'

# command itself is first argument
command = argv._.shift()

# special case for "create" command
if command == 'create' || command == 'gadgets'
  p = argv._.shift()
  # set command to "createGadget" or "createCourse"
  command += p[0].toUpperCase() + p.slice(1)

# if no dirs were specified after `versal something` then
# run command from current `.` directory
if !argv._.length
  argv._.push('.')

# options - the rest of argv besides the special fields
options = _.omit(_.clone(argv), '_', '$0')

try
  sdk[command].apply(null, [argv._, options, (err) ->
    if err
      console.log err
  ])
catch err
  console.log err
