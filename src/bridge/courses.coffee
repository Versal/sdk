_ = require 'underscore'

module.exports =
  show: (req, res) ->
    return res.send 404 unless req.course
    res.send req.course.toJSON { lessons: true, gadgets: true }

  update: (req, res) ->
    return res.send 404 unless req.course
    req.course.save req.body
    res.send 200, req.course.toJSON()

  # We expect req.datastore to be set in bridge.coffee/setupAPI
  load: (req, id, fn) ->
    course = fn null, req.datastore.courses.get id

  # progress endpoints
  # POST /courses/1/start
  start: (req, res) ->
    res.send 404 unless req.course
    res.send 200

  # GET /courses/1/progress
  showProgress: (req, res) ->
    return res.send 404 unless req.course
    res.send req.course.progress.toJSON()

  # PUT /courses/1/progress
  updateProgress: (req, res) ->
    return res.send 404 unless req.course
    req.course.progress.save req.body
    req.course.save()
    res.send req.course.progress.toJSON()


