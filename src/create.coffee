path = require('path')
fs = require('fs-extra')
manifest = require('./manifest')
exec = require('child_process').exec

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

  template = options.template || 'iframe'
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
            if err then return callback err

            # Don't do this for React gadget
            # Currently name in manifest must equal to the name of property
            # that gadget developer sets on window object to make it available for player
            # E.g., if your gadget is called 'foo' in manifest, you must export window.foo
            # Convention is to use PascalCase for exports.
            # TODO: export a module and use requirejs to download external dependencies
            # (blocked by the fact that player is built by r.js at the moment)
            if template == 'iframe' then gadgetManifest.name = name

            fs.writeJson path.join(dir, 'versal.json'), gadgetManifest, (err) ->
              if err then return callback err

              # If bower.json is present in target directory, run bower install
              bowerPath = path.resolve dir, 'bower.json'
              fs.exists bowerPath, (exists) ->
                # Provide --noBower to avoid installing bower dependencies
                return callback() if options.noBower
                return callback() unless exists

                console.log 'Installing bower dependencies...'

                # config.interactive is to prevent bower asking for
                # permission to collect statistics anonymously
                child = exec 'bower install --config.interactive=false',
                  { detached: true, cwd: dir },
                  (err, stdout, stderr) ->
                    if err
                      console.warn 'Having troubles running bower install. npm ' +
                                   'install -g bower, if you have not installed it yet.'
                    callback()
