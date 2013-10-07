status = require './status'

module.exports =
  command: (id, options = {}, callback = ->) ->
    options.catalog = 'rejected' unless options.catalog
    status id, options, callback