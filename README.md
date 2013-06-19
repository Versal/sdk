Versal Gadget SDK
===================

Installation
-------------------

If you want to make changes to the SDK install it from source:
```
git clone git@github.com:Versal/sdk
cd sdk
git submodule update
npm install
npm link
```

If you don't need to change SDK, install it with `npm` from github's private repository:
```
npm install -g git+ssh://git@github.com:Versal/sdk.git
```

### Gadget Documention

Run `docs` sub-command to view sdk and gadget documentation:

```
versal docs
```

Now you can view gadget documentation at [http://localhost:4000/docs](http://localhost:4000/docs)

### SDK Development

#### Pull requests

*Every pull request should bump the version number!*

#### Building docs

*Note: assumes you keep the `gadget-docs` repo in the same directory as the `sdk` repo

    grunt exec:build-docs

#### Building player

*Note: assumes you keep the `player` repo in the same directory as the `sdk` repo

    grunt exec:build-player

### 3rd Party Developers

To initiate a 3rd party gadget developer prior to public release they should be added to the `3rd-party-gadget-developer` group on GitHub. They should also, at minimum, be told about the `versal docs`.
