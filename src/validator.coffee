path = require 'path'
async = require 'async'
restapi = require './restapi'
manifest = require './manifest'
_ = require 'underscore'
semver = require 'semver'

versionExists = (manifestInfo, gadgets) ->
  return _.any gadgets, (gadget) ->
    return semver.gte gadget.version, manifestInfo.version

getAllVersionsOfGadget = (name, gadgets) ->
  return _.select gadgets, (gadget) -> name == gadget.name

getAllGadgets = (options, callback) ->
  async.concat ['approved', 'sandbox'], (catalog, cb) ->
    restapi.getGadgetCatalog catalog, options, cb
  , callback

getNextGadgetVersion = (name, gadgets) ->
  latestVersion = _.pluck(gadgets, 'version').sort(semver.compare).pop()
  return semver.inc latestVersion, 'patch'

# TODO function and supporting functions are a temporary measure
# until rest-api#1693 is resolved
assertValidVersion = (dir, options, callback) ->
  manifest.readManifest dir, (err, manifestInfo) ->
    if err then return callback err
    getAllGadgets options, (err, allGadgets) ->
      if err then return callback err
      gadgets = getAllVersionsOfGadget manifestInfo.name, allGadgets
      if versionExists manifestInfo, gadgets
        manifestPath = manifest.lookupManifest dir
        version = manifestInfo.version
        name = path.basename manifestPath
        nextVersion = getNextGadgetVersion name, gadgets
        errorMessage = "Version 'v#{version}' or greater already exists." +
        "\n       Bump the version in '#{name}' to '#{nextVersion}'" +
        "\n       or higher before uploading."
        return callback(new Error(errorMessage))

      else
        return callback()

module.exports =
  checkProject: (dir, options, callback) ->
    assertValidVersion dir, options, callback
