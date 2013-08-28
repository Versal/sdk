define [
  './metrics/ga'
  './metrics/versal_analytics'
], (googHandler, versalHandler) ->

  log = ->
    googHandler.apply @, arguments
    versalHandler.apply @, arguments

  window.onerror = (message, url, line) ->
    log 'Error', message, { url, line }

  log
