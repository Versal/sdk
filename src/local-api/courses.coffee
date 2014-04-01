express = require 'express'
_ = require 'underscore'
lessons = require './lessons'

courses = express()

courses.load = (req, res, next) ->
  if req.param('courseid') == 'local'
    req.course = req.datastore.course
    req.course.palette = req.datastore.projects
  next()

courses.get '/courses/:courseid', (req, res) ->
  return res.send 404 unless req.course
  res.json req.course

courses.put '/courses/:courseid', (req, res) ->
  return res.send 404 unless req.course
  _.extend req.course, req.body
  res.json req.course

courses.post '/courses/:courseid/start', (req, res) ->
  res.send 404 unless req.course
  res.send 200

courses.get '/courses/:courseid/progress', (req, res) ->
  return res.send 404 unless req.course
  res.json req.course.progress

courses.put '/courses/:courseid/progress', (req, res) ->
  return res.send 404 unless req.course
  _.extend req.course.progress, req.body
  res.json req.course.progress

module.exports = courses
