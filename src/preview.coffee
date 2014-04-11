express = require 'express'
path = require 'path'
LocalAPI = require './local-api/api'
async = require 'async'

HTML_PATH = path.join(__dirname, '../html')

module.exports = (dirs, options, callback = ->) ->
  if typeof dirs == 'string' then dirs = [dirs]
  api = new LocalAPI()

  async.map dirs, api.linkGadget.bind(api), (err, results) ->
    if err then return callback err

    if options.port
      serverOptions =
        port: options.port
        apiMiddleware: api.middleware()
        playerPath: path.join(HTML_PATH, 'player')

      if options.player
        serverOptions.playerPath = path.resolve(options.player)

      startServer api, serverOptions

    callback null, results

startServer = (api, options) ->
  server = express()
    .use(express.json())
    .use(express.urlencoded())

    .use(express.static(options.playerPath))
    .use(express.static(HTML_PATH))
    .use('/api', api.middleware())
    .use(express.logger())

  server.listen options.port
