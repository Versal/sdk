status = require './status'

module.exports =
  command: (id, options = {}, callback = ->) ->
    options.catalog = 'approved' unless options.catalog
    status id, options, callback