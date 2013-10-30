_ = require 'underscore'
needle = require 'needle'
path = require 'path'
fs = require 'fs-extra'
sdk = require '../sdk'

module.exports =
  command: (dir, options = {}, callback = ->) ->
    options.sessionId ?= sdk.config.get 'sessionId', options
    options.apiUrl ?= sdk.config.get 'apiUrl', options

    unless options.sessionId
      return callback new Error 'Valid sessionId is required to upload course.\n Please, run "versal signin".'

    dir = path.resolve dir

    if options.meta
      courseMetadata = options.meta
    else
      courseMetadataPath = path.join(dir, 'course.json')
      courseMetadata = @tryRequire(courseMetadataPath) || {}

    unless courseMetadata.title
      return callback new Error 'Title of the course is not specified. Please, check your course.json'

    coursePath = path.join dir, 'versal_data', 'course.json'
    unless fs.existsSync coursePath
      return callback new Error "versal_data/course.json not found in #{coursePath}"

    # Don't use id from versal_data/course.json - that's a local id
    course = _.omit fs.readJsonSync(coursePath), 'id'
    # Use id and title from course.json
    course = _.extend course, courseMetadata

    options.url = "#{options.apiUrl}/courses/"
    options.method = "post"

    if courseMetadata.id
      options.url += courseMetadata.id
      options.method = "put"

    remoteAssets = @tryRequire path.join(dir, 'versal_data', 'remote_assets.json')
    if remoteAssets then course = @replaceAssets course, remoteAssets

    @uploadCourse course, options, (err, body) =>
      if err then return callback err
      console.log "course #{body.id} successfully uploaded"

      unless courseMetadata.id
        courseMetadata.id = body.id
        fs.outputJsonSync courseMetadataPath, courseMetadata
      callback null

  uploadCourse: (course, options, callback) ->
    requestOptions =
      json: true
      timeout: 120000
      headers:
        SESSION_ID: options.sessionId

    needle.request options.method, options.url, course, requestOptions, (err, res, body) ->
      # Error code
      if !err && res.statusCode >= 300 then err = new Error body.message

      # Error sending the request
      if err
        if _.isFunction options.error then options.error err
        return callback err

      # OK code
      if res.statusCode == 200 || res.statusCode == 201
        if _.isFunction options.success then options.success body
        return callback null, body

  tryRequire: (file) ->
    if fs.existsSync file
      return fs.readJsonSync file
    else
      return null

  # Replace assets is a temporary hack for SAT courses
  # It should give place to something more generic, once
  # assets are revised.
  # Ideally,
  # 1. Platform should allow to upload assets with client-generated Ids
  # 2. Asset json should be no more than "ID"
  replaceAssets: (course, remoteAssets) ->
    for lesson in course.lessons
      for gadget in lesson.gadgets
        if replacer = @replacers[gadget.type]
          replacer gadget.config, remoteAssets
    return course

  replacers:
    'versal/video@0.1.1': (config, remoteAssets) ->
      config.myVideo = getReplacement config.myVideo, remoteAssets

    'versal/image@0.7.3': (config, remoteAssets) ->
      config.asset = getReplacement config.asset, remoteAssets

    'versal/math@0.0.2': (config, remoteAssets) ->
      for section in _.values config
        if section.questions
          for question in section.questions
            if question.image
              question.image = getReplacement question.image, remoteAssets
            if question.answers
              for answer in question.answers
                if answer.image
                  answer.image = getReplacement answer.image, remoteAssets

getReplacement = (asset, remoteAssets) ->
  unless asset._path
    console.log '_path is not set'
    return asset
  remote = remoteAssets[asset._path]
  unless remote
    console.log 'remote asset not found for ', asset._path
    return asset
  return remote