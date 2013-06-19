_ = require 'underscore'
connect = require 'connect'
http = require 'http'
path = require 'path'
open = require 'open'

defaults =
  port: 4000

module.exports = 
  command: (dirs, options, callback = ->) ->
    options = _.extend defaults, options

    docsPath = "#{__dirname}/../../docs"
    url = "http://localhost:#{options.port}"

    app = connect().use connect.static(docsPath)
    http.createServer(app).listen options.port

    console.log ''
    console.log " \\ \\/ /  Starting docs server on #{url}"
    console.log '  \\/ /   Press Ctrl + C to exit...'
    console.log ''

    if options.open then open url

    callback()
