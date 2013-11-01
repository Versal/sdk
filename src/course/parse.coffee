path = require 'path'
glob = require 'glob'
cml = require 'cml'
fs = require 'fs-extra'

module.exports = parse =
  command: (dir, options = {}, callback = ->) ->
    unless dir
      return callback new Error 'dir is required for "versal course parse"'

    dest = options.dest || path.join dir, 'versal_data'
    fs.mkdirsSync dest unless fs.existsSync dest

    # course.json in current folder might contain course title, description, etc.
    courseMetadataPath = path.join dir, 'course.json'
    assetsPath = path.join dest, 'local_assets.json'

    if fs.existsSync courseMetadataPath
      options.course = fs.readJsonSync courseMetadataPath
    if fs.existsSync assetsPath
      options.assets = fs.readJsonSync assetsPath

    sourceFiles = glob.sync path.join dir, 'lessons/*.md'

    try
      result = cml sourceFiles, options
    catch err
      callback err

    coursePath = path.join dest, 'course.json'

    fs.outputJsonSync coursePath, result.course
    fs.outputJsonSync assetsPath, result.assets

    callback null, result
