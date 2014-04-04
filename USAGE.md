# Usage

### versal signin

This command will sign you in to Versal.com. You will be asked your versal email and password.
The session ID will be stored in `~/.versal/config.json`.

### versal create \<name\>

Creates a gadget boilerplate in the named directory. If this directory already exists, the command `versal create` will not do anything.

### versal create \<name\> [--template ttt]

Use a custom template for creating a new gadget project.

Supported templates: `minimal`, `space`

### versal preview [\<directory1\> \<directory2\> \<directory3\> ...]

Launches a local Player and API server for testing your new gadget in the "sandbox". If multiple
gadget directories are specified, any gadgets with valid `manifest.json` files
will be added to your "sandbox" tray.

If no directory is specified, the current working directory will be used.

### versal publish [\<directory\>]

Publishes your gadget to versal.com. The following steps are taken:

- Ensures the presence of a `manifest.json` file.
- Ensures a valid Session ID is specified in your config file.
- Compresses the gadget folder to an archive, excluding files and folders specified in your `.versalignore` file.
- Uploads the archive to the stack.versal.com API.

If no directory is specified, the current working directory will be used.
