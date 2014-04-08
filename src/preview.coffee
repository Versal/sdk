express = require 'express'
path = require 'path'
LocalAPI = require './local-api/api'
async = require 'async'
fs = require 'fs'

HTML_PATH = path.join(__dirname, '../html')
BUNDLED_PLAYER = path.join(HTML_PATH, 'player')
LINKED_PLAYER = path.join(__dirname, '../node_modules/player/dist')

module.exports = (dirs, options, callback = ->) ->
  if typeof dirs == 'string' then dirs = [dirs]
  api = new LocalAPI()

  async.map dirs, api.linkGadget.bind(api), (err, results) ->
    if err then return callback err
    fs.exists LINKED_PLAYER, (playerLinked) ->
      options.playerPath  = if playerLinked then LINKED_PLAYER else BUNDLED_PLAYER
      if options.port then startServer api, options
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
