path = require 'path'
async = require 'async'
restapi = require './restapi'
manifest = require './manifest'
_ = require 'underscore'
semver = require 'semver'

versionExists = (manifestInfo, gadgets) ->
  otherGadgetVersions = _.select gadgets, (gadget) ->
    manifestInfo.name == gadget.name
  return _.any otherGadgetVersions, (gadget) ->
    return semver.gte gadget.version, manifestInfo.version

getAllGadgetVersions = (options, callback) ->
  async.concat ['approved', 'sandbox'], (catalog, cb) ->
    restapi.getGadgetCatalog catalog, options, cb
  , callback

# TODO function and supporting functions are a temporary measure
# until rest-api#1693 is resolved
assertValidVersion = (dir, options, callback) ->
  getAllGadgetVersions options, (err, gadgets) ->
    manifest.readManifest dir, (err, manifestInfo) ->
      if err then return callback err

      if versionExists manifestInfo, gadgets
        manifest.lookupManifest dir, (manifestPath) ->
          errorMessage = "Version 'v#{manifestInfo.version}' or greater already exists." +
          "\n       Bump the version in '#{path.basename manifestPath}' before uploading."
          return callback(new Error(errorMessage))

      else
        return callback()

module.exports =
  checkProject: (dir, options, callback) ->
    assertValidVersion dir, options, callback
