fs = require 'fs-extra'
manifest = require './manifest'
path = require 'path'
semver = require 'semver'

getCurrentVersion = (manifestPath) ->
  fs.readJsonSync(manifestPath)?.version

getNewVersion = (currentVersion, versionArg, callback) ->
  newVersion = semver.valid versionArg

  unless newVersion
    newVersion = semver.inc currentVersion, versionArg

  unless newVersion
    message = "Invalid version argument: `#{versionArg}'"
    console.log message
    return callback new Error message

  if newVersion == currentVersion
    message = "Version hasn't changed"
    return callback new Error message

  callback null, newVersion

writeVersionToFile = (manifestPath, currentVersion, newVersion) ->
  previousManifestContent = fs.readFileSync(manifestPath).toString()
  versionRegex = new RegExp "(\"version\":\\s*\")#{currentVersion}(\",?)"
  versionReplacement = "$1#{newVersion}$2"
  newManifestContent = previousManifestContent.replace versionRegex, versionReplacement
  fs.writeFileSync manifestPath, newManifestContent

module.exports = (versionArg, callback) ->
  manifest.lookupManifest process.cwd(), (manifestPath) ->
    currentVersion = getCurrentVersion manifestPath

    unless currentVersion
      manifestName = path.basename manifestPath
      message = "'#{manifestName}' has no `version` set"
      return callback new Error message

    getNewVersion currentVersion, versionArg, (err, newVersion) ->
      if err then return callback err
      writeVersionToFile manifestPath, currentVersion, newVersion
      callback null, currentVersion, newVersion
