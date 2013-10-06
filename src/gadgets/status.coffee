_ = require 'underscore'
sdk = require '../sdk'
needle = require 'needle'

module.exports = (id, options = {}, callback = ->) ->
  unless options.sessionId
    options.sessionId = sdk.config.get 'sessionId', options

  unless options.apiUrl
    options.apiUrl = sdk.config.get 'apiUrl', options

  unless options.catalog
    callback new Error 'You must provide a catalog to update gadget status'

  url = "#{options.apiUrl}/gadgets/#{id}/status"
  params = catalog: options.catalog
  if options?.hidden then params['hidden'] = true

  requestOptions =
    json: true
    headers:
      SESSION_ID: options.sessionId

  needle.post url, params, requestOptions, (err, res, body) ->
    # Error code
    if !err && res.statusCode >= 300 then err = new Error body.message

    # Error sending the request
    if err
      if _.isFunction options.error then options.error err
      return callback err

    # OK code
    if res.statusCode == 200
      if options.verbose then console.log body
      if _.isFunction options.success then options.success body
      return callback null, body