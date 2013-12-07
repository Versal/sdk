_ = require 'underscore'

module.exports =
  show: (req, res) ->
    return res.send 404 unless req.course
    courseJson = req.course.toJSON { lessons: true, gadgets: true, palette: true }
    courseJson.assetUrlTemplate = '//localhost:3000/assets/<%= id %>'
    res.send courseJson

  update: (req, res) ->
    return res.send 404 unless req.course
    req.course.save req.body
    res.send 200, req.course.toJSON()

  # We expect req.datastore to be set in bridge.coffee/setupAPI
  load: (req, id, fn) ->
    # HACKETY HACKERY: populate palette for the course
    usedTypes = (course) ->
      _.uniq _.flatten course.lessons.map (l) ->
        l.gadgets?.map (g) -> g.get('type')

    usedProjects = (course) ->
      types = usedTypes course
      req.datastore.projects.filter (p) ->
        _.contains types, p.type()

    course = req.datastore.courses.get id
    course.palette.reset usedProjects course

    fn null, course

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


