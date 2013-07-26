_ = require 'lodash'

# Commands that are displayed in cli help
commands = [
  "create"
  "preview"
  "publish"
  "docs"
]

# Debug commands are not displayed in cli help, but still runnable
debugCommands = [
  "validate"
  "compile"
  "compress"
  "upload"
]

commandsString = commands.join " | "
usageMessage = "Versal Gadget SDK. Usage: versal (#{commandsString}) <dir> [--options] [--version]"

argv = require("optimist")
  .usage(usageMessage)
  .check((argv) ->
    if argv.version
      packageInfo = require('../package.json')
      console.log packageInfo.version
      process.exit()
    if argv._.length == 0
      throw new Error 'command has not been specified'

    command = argv._[0]
    if !_.contains(commands.concat(debugCommands), command)
      throw new Error "invalid command: #{command}"

    # special case for "create" command - it requires second argument
    # Second argument must be either "gadget" or "course"
    if command == 'create'
      if not (argv._.length > 1 && _.contains(['gadget','course'], argv._[1]))
        # show usage information
        throw new Error '"create" command requires second argument.\nUsage: "versal create (gadget|course) <dir> [--options]\nExamples:\n\tversal create gadget chemistry-gadget\n\tversal create course chemistry-course\n'

    return true
  ).argv

sdk = require '../src/sdk'

# command itself is first argument
command = argv._.shift()

# special case for "create" command
if command == 'create'
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
