fs = require 'fs-extra'
path = require 'path'
config = require '../config'
needle = require 'needle'
exec = require('child_process').exec
sdk = require '../sdk'
ncp = require 'ncp'

module.exports = install =
  command: (dir, options = {}, callback = ->) ->
    callback new Error 'gadget type is required for versal install' unless dir

    if dir[0] == '.' || dir[0] == '/'
      @installFromFolder dir, options, callback
    else
      @installFromApi dir, options, callback

  installFromFolder: (dir, options, callback) ->
    unless fs.existsSync dir
      return callback new Error 'directory not found'

    target = options.cwd || path.resolve '.'

    sdk.compile dir, (err) ->
      if err then return callback err
      distPath = path.join dir, 'dist'
      manifestPath = path.join distPath, 'manifest.json'
      manifest = fs.readJsonSync manifestPath

      unless manifest.username && manifest.name && manifest.version
        return callback new Error 'Gadget manifest is missing one of the required fields: username, name or version.'

      target = install.getInstallPath target, manifest
      if fs.existsSync target then fs.removeSync target
      fs.mkdirsSync target
      ncp distPath, target, callback

  installFromApi: (type, options, callback) ->
    unless type = @parseType type
      return callback new Error 'Invalid gadget type. Type should be specified as "username/gadget@version"'

    options.apiUrl = sdk.config.get 'apiUrl' unless options.apiUrl
    options.sessionId = sdk.config.get 'sessionId' unless options.sessionId

    # TODO: Verify sessionId
    if options.sessionId
      @downloadFromApi type, options, callback
    else
      sdk.signin '.', options, (err) =>
        if err then return callback err
        options.sessionId = sdk.config.get 'sessionId'
        @downloadFromApi type, options, callback

  downloadFromApi: (type, options, callback) ->
    target = options.cwd || path.resolve '.'

    manifestUrl = "#{options.apiUrl}/gadgets/#{type.username}/#{type.name}/#{type.version}/manifest"
    compiledUrl = "#{options.apiUrl}/gadgets/#{type.username}/#{type.name}/#{type.version}/compiled.zip"

    requestOptions =
      headers:
        SESSION_ID: options.sessionId

    needle.get manifestUrl, requestOptions, (err, res, body) ->
      if err then return callback err

      unless res.statusCode == 200
        return callback new Error body.message

      manifest = body
      # FIXME: remove this boilerplate when all platform gadgets are migrated
      manifest.username = type.username unless manifest.username

      unless manifest.username && manifest.name && manifest.version
        return callback new Error 'Gadget manifest is missing one of the required fields: username, name or version.'

      needle.get compiledUrl, requestOptions, (err, res, body) ->
        if err then return callback err
        target = install.getInstallPath target, manifest
        if fs.existsSync target then fs.removeSync target
        fs.mkdirsSync target
        fs.writeFileSync "#{target}/compiled.zip", body

        # TODO: needs to be tested on windows
        unzip = exec "unzip compiled.zip", cwd: target, (err) ->
          if err
            return callback new Error "unzip process exited with code #{err.code}"
          callback()

  parseType: (type) ->
    return false unless type
    return false unless type.indexOf('/') > 0 && type.indexOf('@') > 0

    [username, name] = type.split('/')
    [name,version] = name.split('@')
    return { username, name, version }

  getInstallPath: (base, manifest) ->
    path.join base, 'versal_data', 'gadgets', manifest.username, manifest.name, manifest.version
