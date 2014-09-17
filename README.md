# Versal Gadget SDK [![Build Status](https://travis-ci.org/Versal/sdk.svg?branch=master)](https://travis-ci.org/Versal/sdk)

## Installation

    npm install -g versal-sdk

If all goes well, you should be able to use the `versal` command-line
tool. If that doesn't work, scroll down to "Installation in depth".

## Quick start

Run `versal -v` to see the current version of the SDK installed. Run `versal` for usage information. To create and preview your first gadget, run:
```
versal create hello-gadget
cd hello-gadget
versal preview
```

## Links
- [Full documentation](https://versal.com/c/gadgets)
- [Helper libraries](https://github.com/Versal/versal-gadget-api)


## Usage

### versal signin

>Sign you in Versal.com. You will be asked for your Versal email and password.
The session ID will be stored in `~/.versal/sdk/default.json`.

### versal create \<name\> [--template \<template-name\>]

>Creates a gadget boilerplate in a new directory with the given name. If this directory already exists, the command `versal create` will not do anything.

>The `--template` option allows you to choose a template. Supported templates: `minimal` (currently the only one).

### versal preview [\<directory1\> \<directory2\> \<directory3\> ...] [--iframe]

>Launches a local Player and API server for testing your new gadget. If multiple
gadget directories are specified, any gadgets with valid `versal.json` files
will be added to your local tray.

>If no directory is specified, the current working directory will be used.

>Use `--iframe` option to preview gadget in a standalone launcher. (see issue #87)

### versal upload [\<directory\>] [--apiUrl https://stack.versal.com/api2]

>Compresses your gadget and uploads it to Versal platform. If no directory is specified, the current working directory will be used. Gadget directory must have a `versal.json`. To upload gadget you need a valid session ID. If uploading fails, use versal signin to obtain a new session ID.

## Installation in depth

### Step one - installing the prerequisites

To begin developing gadgets, you will need:
- Windows, Mac OS X, or Linux
- [git](http://git-scm.com/book/en/Getting-Started-Installing-Git)
- [node/npm](http://nodejs.org/)  You need `node` version 0.10.21 or newer.
- a [Versal.com](http://versal.com) account

If you do not have `git` and `node` already, the first step is to install them, and this is different for each OS.

#### On Mac OS X

To install `git` and `npm` under Mac OS X with [Homebrew](http://brew.sh/):

    brew install git
    brew install npm

#### On Linux

To install `git` and `npm` under a recent Ubuntu Linux:

    sudo apt-get install --yes git npm curl nodejs-legacy

#### On Windows

To install `git` and `npm` under MS Windows:

* Install `git` by downloading and running the EXE installer from [msysgit.github.com](http://msysgit.github.com)
* Install `npm` and `node` from [nodejs.org](http://nodejs.org/download/) by downloading and running the MSI installer. You might need to manually create `~/AppData/Roaming/npm` folder ([more info](http://stackoverflow.com/questions/25093276/nodejs-windows-error-enoent-stat-c-users-rt-appdata-roaming-npm))
* You need `zip`, for example from the [gnuwin32](http://downloads.sourceforge.net/gnuwin32/zip-3.0-setup.exe) project
* Start "Git Bash" from the menu; this opens a more Unix-like environment for the command line
* Copy `zip` executables to the Bash path, for example with the command `cp /c/Program\ Files/GnuWin32/bin/* /usr/local/bin/`. To make sure that the `zip` command is available in your "Git Bash", type `zip`: you should get usage information.


### Step two - installing the Versal SDK

Once you have `npm`, you can install the Versal SDK:

    npm install -g versal-sdk

(If this gives a permission error on your system, run `sudo npm install -g versal-sdk`. However, it is better to avoid using `sudo` for `npm`, if it is possible on your system.)

This will install the system-wide command `versal`. With this command, you can test your gadgets and publish them on the Versal platform. To check that the Versal SDK has been installed, run the command `versal -v`. This should print the version.

## Testing the hello-world gadget

To verify that your installation works, let's test a sample gadget. This gadget shows a "hello, world" message with a custom word and color inserted by the course author. The learner can click on this word and toggle the italics and boldface font on the message. The gadget also displays an image uploaded by the course author.

Clone the [Versal/hello-world-gadget](https://github.com/Versal/hello-world-gadget) repo:

    git clone https://github.com/Versal/hello-world-gadget.git
    cd hello-world-gadget
    bower install

Once in the `hello-world-gadget` directory, run the command:

    versal preview

This will start a local HTTP server on port `3000`. Now open the URL [localhost:3000](http://localhost:3000) in a web browser. You will see an empty lesson and a test gadget in the gadget tray below. Double-click on that gadget; you will see that the gadget has been added to the lesson.


## Housekeeping instructions

### Contributing

If you want to contribute to SDK development, install it from source:

    git clone https://github.com/Versal/sdk.git
    cd sdk
    npm install
    npm link
    npm test

### Updating the player

A copy of the [Player](/Versal/player) is bundled at `./html/player`. To update Player copy `/path/to/player/dist` to `./html/player`:

### Using development branch of the player

If you want to use development branch of the player, you can run `versal preview` with `--player` option:

    versal preview --player ~/versal/player/dist
