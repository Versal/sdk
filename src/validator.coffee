path = require 'path'
async = require 'async'
restapi = require './restapi'
manifest = require './manifest'
_ = require 'underscore'
semver = require 'semver'

versionExists = (manifest, gadgets) ->
  otherGadgetVersions = _.select gadgets, (gadget) ->
    manifest.name == gadget.name
  return _.any otherGadgetVersions, (gadget) ->
    return semver.gte gadget.version, manifest.version

# TODO function and supporting functions are a temporary measure
# until rest-api#1693 is resolved
module.exports =

  checkProject: (dir, options, callback) ->
    async.concat ['approved', 'sandbox'], (catalog, cb) ->
      restapi.getGadgetCatalog catalog, options, cb
    , (err, gadgets) ->

      manifest.readManifest dir, (err, manifestInfo) ->
        if err then return callback err

        if versionExists manifestInfo, gadgets
          manifest.lookupManifest dir, (manifestPath) ->
            errorMessage = "Version 'v#{manifestInfo.version}' or greater " +
            "already exists. Bump the version in '#{path.basename manifestPath}' " +
            "before uploading."
            return callback(new Error(errorMessage))

        else
          return callback()
