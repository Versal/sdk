module.exports =
  exec: (command, args...) ->
    @[command].apply null, args

  create: -> require('./create/create') (arguments)
  preview: -> require('./preview/preview') (arguments)
  compile: -> require('./compile/compile') (arguments)