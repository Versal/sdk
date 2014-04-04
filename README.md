# Versal Gadget SDK

## Short summary

Dependencies: npm

[Detailed instructions for installing dependencies](./INSTALL.md)

The Versal SDK is now published as a node.js package. To install:

  npm install -g versal-sdk

If all goes well, you should now have be able to use the `versal` command-line
tool.  If that didn't work, make sure your `$PATH` is set appropriately to
include the install location.

Usage:

	versal create \<new-gadget-dir\>
	versal preview
	versal signin
	versal publish

[Detailed usage](./USAGE.md)

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
