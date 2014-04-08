# Versal Gadget SDK [![Build Status](https://travis-ci.org/Versal/sdk.svg?branch=master)](https://travis-ci.org/Versal/sdk)

The Versal SDK is published as a node.js package. To install:

    npm install -g versal-sdk

If all goes well, you should be able to use the `versal` command-line
tool. If that doesn't work, scroll down to "Installation in depth".

## Verifying installation

Run `versal -v` to see the current version of the SDK installed. Run `versal` for usage information.

## Usage

### versal signin

Sign you in to Versal.com. You will be asked for your Versal email and password.
The session ID will be stored in `~/.versal/config.json`.

### versal create \<name\> [--template \<template-name\>]

Creates a gadget boilerplate in a new directory with the given name. If this directory already exists, the command `versal create` will not do anything.

The `--template` option allows you to choose a template. Supported templates: `minimal` (default), `space`.

### versal preview [\<directory1\> \<directory2\> \<directory3\> ...]

Launches a local Player and API server for testing your new gadget. If multiple
gadget directories are specified, any gadgets with valid `manifest.json` files
will be added to your local tray.

If no directory is specified, the current working directory will be used.

### versal upload [\<directory\>] [--apiUrl https://stack.versal.com/api2]

Compresses your gadget and uploads it to Versal platform. If no directory is specified, the current working directory will be used. Gadget directory must have a manifest. To upload gadget you need a valid session ID. If uploading fails, use versal signin to obtain a new session ID.

## Installation in depth

You'll need a working local copy of [Node](http://nodejs.org/) and
[npm](https://www.npmjs.org/).

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

If that doesn't help, see [Joyent's installation
instructions](http://www.joyent.com/blog/installing-node-and-npm/) for more
information or create an issue in this repository.

## Contributing

If you want to contribute to SDK development, install it from source:

    git clone https://github.com/Versal/sdk.git
    cd sdk
    npm install
    npm link
    npm test

### Updating player

A copy of the [Player](/Versal/player) is bundled in the "html" folder. To
update Player or use a custom branch, clone player next to `sdk`, build it,
and then `npm run copy-player` from within the SDK folder.

If you want to use development branch of player, symlink development version of the player to html/dev:

    ln -s ~/path/to/player/dist html/dev
    versal preview --player dev
