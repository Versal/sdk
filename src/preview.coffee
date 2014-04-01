express = require 'express'
path = require 'path'
LocalAPI = require './local-api/api'
async = require 'async'

HTML_PATH = path.join(__dirname, '../html')
PLAYER_PATH = path.join(HTML_PATH, 'player')

preview = (dirs, options, callback = ->) ->
  if typeof dirs == 'string' then dirs = [dirs]
  if typeof options == 'function' then callback = options

  api = new LocalAPI()
  port = options.port || 3000

  async.reduce dirs, 0, api.linkGadgetReduce.bind(api), (err, cnt) ->
    if err then return callback err
    if cnt == 0 then return callback new Error('Could not find any gadget manifests to preview.')
    preview.startServer api, port
    callback null, cnt, port

preview.startServer = (api, port) ->
  server = express()
    .use(express.json())
    .use(express.urlencoded())

    .use(express.static(PLAYER_PATH))
    .use(express.static(HTML_PATH))
    .use('/api', api.middleware())
    .use(express.logger())

  server.listen port

module.exports = preview
