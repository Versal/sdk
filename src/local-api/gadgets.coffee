express = require 'express'
shortid = require 'shortid'
_ = require 'underscore'

gadgets = express()

gadgets.load = (req, res, next) ->
  id = req.param('gadgetid')
  if id && req.lesson
    req.gadget = _.findWhere req.lesson.gadgets, { id }
  if !req.gadget then return res.send 404, "Gadget not found"
  next()

gadgets.get '/courses/:courseid/lessons/:lessonid/gadgets', (req, res) ->
  res.json req.lesson.gadgets

gadgets.get '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid', (req, res) ->
  res.json req.gadget

gadgets.post '/courses/:courseid/lessons/:lessonid/gadgets', (req, res) ->
  gadget = _.pick req.body, 'config', 'userState', 'index', 'type'
  gadget.id = shortid()
  req.lesson.gadgets.push gadget
  res.send 201, gadget

gadgets.delete '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid', (req, res) ->
  req.lesson.gadgets = _.without req.lesson.gadgets, req.gadget
  res.send 200

gadgets.put '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid/config', (req, res) ->
  req.gadget.config = req.body
  res.json {}

gadgets.put '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid/userstate', (req, res) ->
  req.gadget.userState = req.body
  res.send {}

gadgets.get '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid/userstate', (req, res) ->
  res.send req.gadget.userState

module.exports = gadgets
