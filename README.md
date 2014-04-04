# Versal Gadget SDK [![Build Status](https://travis-ci.org/Versal/sdk.svg?branch=master)](https://travis-ci.org/Versal/sdk)

## Dependencies

You'll need a working local copy of [Node](http://nodejs.org/) and
[npm](https://www.npmjs.org/). See [Joyent's installation
instructions](http://www.joyent.com/blog/installing-node-and-npm/) for more
information.

## Installation

    npm install -g versal-sdk

If all goes well, you should now have be able to use the `versal` command-line
tool.  If that didn't work, make sure your `$PATH` is set appropriately to
include the install location.

## Usage

### versal signin

Signs a user in using versal username and password. A session ID will be stored
in `~/.versal/config.json`.

### versal create \<name\>

Creates a gadget boilerplate in the named directory. Does not do anything,
if the directory already exists.

### versal preview [\<directory\> \<dir2\> \<dir3\> ...]

Launches a local Player and API server for testing your new gadget. If multiple
gadget directories are specified, any gadgets with valid `manifest.json` files
will be added to your "sandbox" tray.

In the case of the `preview` and `publish` commands, if no directory is
specified then the current working directory will be assumed.

### versal publish [\<directory\>]

Publishes your gadget to versal.com. The following steps are taken:

- Ensures the presence of a `manifest.json` file.
- Ensures a valid Session ID is specified in your config file.
- Compresses the gadget folder to an archive, excluding files and folders
specified in your `.versalignore` file.
- Uploads archive to the stack.versal.com API.

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
