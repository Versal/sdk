# v1.6.4

  * Use zlib instead of exec'ing zip
  * Housekeeping/cleanup
  * Component launcher pass through on compile

---

# v1.6.3

  * Rename codio buttons
  * Add PUT gadget order
  * Fix upload bug
  * Error out with exit 1 when appropriate
  * Local API fixed to correspond to rest-api
  * Fix iframe preview
  * Polish docs

---

# v1.6.2

  * Run `bower install` in `versal create`
  * Updated templates to new format (`versal.html`, `versal.json`)
  * Removed broken template "space"
  * Fixed editing mode not working when clicking the gear

---

# v1.6.1

  * Bump Player to 1.6.4
  * Use versal.json instead of manifest.json by default
  * Warn when uploading new version of a gadget without changing the version

---

# v1.6.0

  * Bump Player to 1.6.3

---

# v1.5.2

  * Use relative asset url path in course.json

---

# v1.5.1

  * Add 'versal codio' command, that creates .codio file in current folder
  * Rename ~/.versal/config.json to ~/.versal/sdk/default.json
  * Use and save versal.json in the compile command

---

# v1.5.0

  * Bump Player to 1.5.2 (from now on we'll keep the SDK minor version in sync with the player minor version)

---

# v0.6.3

  * Add Travis CI
  * Minor fixes (bugs and documentation)
  * Bump Player to 1.2.2 (fix sync events, iframe border, asset reps, etc...)

---

# v0.6.2

  * Bump Player to 1.2.1 (support for Blob in Asset.upload)

---

# v0.6.1

  * Update templates to accomodate for Player 1.2.0

---

# v0.6.0

  * Bump Player to 1.2.0 (prefer /index.html to /assets/index.html)

---

# v0.5.3

  * Bump Player to 1.1.2 (fix getPath/setPath behavior)
  * Use 0.0.1 as default version for new gadgets

---

# v0.5.2

  * Generate legacy required files at publish time

---

# v0.5.1

  * Updates to player at 1.1.1
  * Fixes requirejs dependency

---

# v0.5.0

  * Initial public release of Versal gadget SDK.
