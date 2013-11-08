_ = require 'underscore'
shortid = require 'shortid'

module.exports =
  index: (req, res) ->
    return res.send 404 unless req.lesson
    res.send req.lesson.gadgets

  show: (req, res) ->
    return res.send 404 unless req.gadget
    res.send req.gadget.toJSON()

  create: (req, res) ->
    return res.send 404 unless req.lesson
    attrs = _.extend id: shortid.generate(), req.body
    gadget = req.lesson.gadgets.create attrs
    req.course.save()
    res.send 201, gadget.toJSON()

  destroy: (req, res) ->
    req.gadget.destroy()
    req.course.save()
    res.send 200

  updateConfig: (req, res) ->
    req.gadget.config.clear()
    req.gadget.config.save req.body
    req.course.save()
    res.send req.gadget.config.toJSON()

  updateUserstate: (req, res) ->
    req.gadget.userState.save req.body
    req.course.save()
    res.send req.gadget.userState.toJSON()

  showUserstate: (req, res) ->
    res.send req.gadget.userState.toJSON()

  # We expect that req.lesson is set in `lessons.coffee/load`
  load: (req, id, fn) ->
    fn null, req.lesson.gadgets.get id
