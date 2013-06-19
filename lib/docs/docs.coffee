connect = require 'connect'
http = require 'http'
path = require 'path'

module.exports = 
  command: (dirs, options, callback = ->) ->

    docsPath = path.join(__dirname, '..', '..', 'docs')
    port = options.port || 4000
    url = "http://localhost:#{port}"

    app = connect().use connect.static(docsPath)
    http.createServer(app).listen port

    console.log ''
    console.log " \\ \\/ /  Starting docs server on #{url}"
    console.log "  \\/ /   Press Ctrl + C to exit..."
    console.log ''

    callback()
