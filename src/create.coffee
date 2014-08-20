path = require('path')
fs = require('fs-extra')
manifest = require('./manifest')

# Creates gadget from template
#   name:         the name of the folder to be created
#   options:
#     template:   which template to use. default - minimal
#     cwd:        where to create gadget. default - process.cwd()
#   callback:     obvious thing
module.exports = (name, options = {}, callback) ->
  if typeof options == 'function'
    callback = options
    options = {}

  unless name
    return callback(new Error('Name of the gadget is required'))

  template = options.template || 'minimal'
  cwd = options.cwd || process.cwd()
  dir = path.join(cwd, name)
  source = path.join(__dirname, '../templates', template)

  fs.exists source, (exists) ->
    if !exists then return callback(new Error('Unknown template ' + template))

    fs.exists dir, (exists) ->
      if exists then return callback(new Error('Directory already exists - not created'))

      fs.mkdirs dir, (err) ->
        if err then return callback err

        fs.copy source, dir, (err) ->
          if err then return callback err

          fs.readJson path.join(dir, 'versal.json'), (err, gadgetManifest) ->
            gadgetManifest.name = name
            fs.writeJson path.join(dir, 'versal.json'), gadgetManifest, callback
