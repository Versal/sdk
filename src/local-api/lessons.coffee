_ = require 'underscore'
express = require 'express'
shortid = require 'shortid'
lessons = express()

lessons.load = (req, res, next) ->
  id = req.param('lessonid')
  if id && req.course
    req.lesson = _.findWhere req.course.lessons, { id }
  if !req.lesson then return res.send 404, "Lesson not found"
  next()

lessons.get '/courses/:courseid/lessons', (req, res) ->
  res.json req.course.lessons

lessons.post '/courses/:courseid/lessons', (req, res) ->
  lesson = req.body
  lesson.id = shortid()
  lesson.gadgets = []
  req.course.lessons.push lesson
  res.send 201, lesson

lessons.get '/courses/:courseid/lessons/:lessonid', (req, res) -> res.send req.lesson
lessons.put '/courses/:courseid/lessons/:lessonid', (req, res) ->
  _.extend req.lesson, req.body
  res.json req.lesson

lessons.delete '/courses/:courseid/lessons/:lessonid', (req, res) ->
  req.course.lessons = _.without req.course.lessons, req.lesson
  res.send 200

module.exports = lessons
