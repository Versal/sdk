express = require 'express'
courses = require './courses'
lessons = require './lessons'
gadgets = require './gadgets'
assets = require './assets'
_ = require 'underscore'

module.exports = (data) ->
  _.defaults data.course,
    progress: {}
    assetUrlTemplate: '/static/<%= id %>'

  api = express()
  api.use express.json()
  api.get '/manifests', (req, res) => res.json data.manifests

  api.all '/assets*', (req, res, next) ->
    _.extend req, _.pick(data, 'assets', 'representations')
    next()

  api.all '/courses/*', (req, res, next) ->
    _.extend req, _.pick(data, 'course')
    next()

  api.all '/courses/:courseid/lessons/:lessonid*', lessons.load
  api.all '/courses/:courseid/lessons/:lessonid/gadgets/:gadgetid*', gadgets.load

  api.use gadgets
  api.use lessons
  api.use courses
  api.use '/assets', assets

  #TODO: Legacy endpoint
  api.get '/gadgets', (req, res) => res.json data.manifests
