express = require 'express'
path = require 'path'
LocalAPI = require './local-api/api'
async = require 'async'

HTML_PATH = path.join(__dirname, '../html')
PLAYER_PATH = path.join(HTML_PATH, 'player')

module.exports = (dirs, options, callback = ->) ->
  if typeof dirs == 'string' then dirs = [dirs]
  api = new LocalAPI()

  async.map dirs, api.linkGadget.bind(api), (err, results) ->
    if err then return callback err
    if options.port then startServer api, options.port

    callback null, results

startServer = (api, port) ->
  server = express()
    .use(express.json())
    .use(express.urlencoded())

    .use(express.static(PLAYER_PATH))
    .use(express.static(HTML_PATH))
    .use('/api', api.middleware())
    .use(express.logger())

  server.listen port
