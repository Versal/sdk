# Default launcher for player application
# Included from app/scripts/config.coffee, this launcher will require
# the player and fire the window.onPlayerReady as soon as it's ready.
require ['player'], (PlayerApplication) ->

  window.onunload = (->) # Forcefully disable bfcache in Firefox.

  if window.onPlayerReady
    window.onPlayerReady PlayerApplication
