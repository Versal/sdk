_ = require 'underscore'
shortid = require 'shortid'

module.exports =
  index: (req, res) ->
    return res.send 404 unless req.course
    res.send req.course.lessons.toJSON gadgets: true

  show: (req, res) ->
    return res.send 404 unless req.lesson
    res.send req.lesson.toJSON gadgets: true

  create: (req, res) ->
    return res.send 404 unless req.course
    attrs = _.extend id: shortid.generate(), req.body
    lesson = req.course.lessons.create attrs
    req.course.save()
    res.send 201, lesson.toJSON()

  update: (req, res) ->
    return res.send 404 unless req.lesson
    req.lesson.save req.body
    req.course.save()
    res.send req.lesson.toJSON gadgets: true

  destroy: (req, res) ->
    req.lesson.destroy()
    req.course.save()
    res.send 200

  # We expect that req.course is set in `courses.coffee/load`
  load: (req, id, fn) ->
    fn null, req.course.lessons.get id
