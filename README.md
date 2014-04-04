# Versal Gadget SDK

## Short summary

The Versal SDK is published as a node.js package. To install:

    npm install -g versal-sdk

If all goes well, you should be able to use the `versal` command-line
tool.  If that doesn't work, make sure your `$PATH` is set appropriately to
include the install location.

Usage:

    versal create \<new-gadget-dir\>
    versal preview
    versal signin
    versal publish

## Dependencies

You'll need a working local copy of [Node](http://nodejs.org/) and
[npm](https://www.npmjs.org/). See [Joyent's installation
instructions](http://www.joyent.com/blog/installing-node-and-npm/) for more
information.

### Mac OS X:

    brew install git
    brew install npm

### Ubuntu Linux:

    sudo apt-get install --yes git npm curl nodejs-legacy

### Microsoft Windows:

* Install `git` by downloading and running the EXE installer from [msysgit.github.com](http://msysgit.github.com)
* Install `npm` and `node` from [nodejs.org](http://nodejs.org/download/) by downloading and running the MSI installer
* You need `zip`, for example from the [gnuwin32](http://downloads.sourceforge.net/gnuwin32/zip-3.0-setup.exe) project
* Start "Git Bash" from the menu; this gives a more Unix-like environment for command-line usage.
* Copy `zip` executables to the Bash path, for example: `cp /c/Program\ Files/GnuWin32/bin/* /usr/bin/`

## Usage

### versal signin

Sign you in to Versal.com. You will be asked for your Versal email and password.
The session ID will be stored in `~/.versal/config.json`.

### versal create \<name\> [--template template-name]

Creates a gadget boilerplate in a new directory with the given name. If this directory already exists, the command `versal create` will not do anything.

The `--template` option allows you to choose a template. Supported templates: `minimal` (default), `space`.

### versal preview [\<directory1\> \<directory2\> \<directory3\> ...]

Launches a local Player and API server for testing your new gadget. If multiple
gadget directories are specified, any gadgets with valid `manifest.json` files
will be added to your local tray.

If no directory is specified, the current working directory will be used.

### versal publish [\<directory\>]

Publishes your gadget to versal.com. The following steps are taken:

- Ensures the presence of a `manifest.json` file.
- Ensures a valid Session ID is specified in your config file.
- Compresses the gadget folder to an archive, excluding files and folders specified in your `.versalignore` file.
- Uploads the archive to the stack.versal.com API.

If no directory is specified, the current working directory will be used.

## Development

If you want to make changes to the SDK, install it from source:

    git clone git@github.com:Versal/sdk
    cd sdk
    npm install
    npm link
    npm test

A copy of the [Player](/Versal/player) is bundled in the "html" folder. To
update Player or use a custom branch, clone player next to `sdk`, build it,
and then `npm run copy-player` from within the SDK folder.
