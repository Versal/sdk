# Versal Gadget SDK

## Prerequisites

* Node.js (we recommend [nvm](https://github.com/creationix/nvm) or [n](https://github.com/visionmedia/n))
* git (if you're on a Mac we recommend using [Homebrew](http://brew.sh/))

See also

* [Building and installing Node.js](https://github.com/joyent/node/wiki/Building-and-installing-Node.js)

* [Installing Node.js via package manage](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

## Installation

If you don't need to change SDK, install it with `npm` from github's private repository:
```
npm install -g git+ssh://git@github.com:Versal/sdk.git
```

If you want to make changes to the SDK install it from source:
```
git clone git@github.com:Versal/sdk
cd sdk
npm install
npm link
```

## Documention

Run `docs` sub-command to view sdk and gadget documentation:

```
versal docs
```

Now you can view gadget documentation at [http://localhost:4000](http://localhost:4000)

## SDK Development

### Building docs

*Note: assumes you keep the `gadget-docs` repo in the same directory as the `sdk` repo

    grunt build-docs

### Building player

*Note: assumes you keep the `player` repo in the same directory as the `sdk` repo

    grunt build-player

### 3rd Party Developers

To initiate a 3rd party gadget developer prior to public release they should be added to the `3rd-party-gadget-developer` group on GitHub. They should also, at minimum, be told about the `versal docs`.
