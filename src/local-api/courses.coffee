express = require 'express'
_ = require 'underscore'

courses = express()

courses.get '/courses/:courseid', (req, res) -> res.json req.course
courses.put '/courses/:courseid', (req, res) ->
  _.extend req.course, req.body
  res.json req.course

# TODO: Legacy
courses.post '/courses/:courseid/start', (req, res) -> res.send 200

courses.get '/courses/:courseid/progress', (req, res) -> res.json req.course.progress
courses.put '/courses/:courseid/progress', (req, res) ->
  _.extend req.course.progress, req.body
  res.json req.course.progress

module.exports = courses
