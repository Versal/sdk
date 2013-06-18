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

To build up a new version of documentation:

#### Building docs

    rm -rf node_modules
    npm install
    grunt exec:build-docs

*Note: unfortunately must remove node_modules to make sure the latest `gadget-docs`*
*TODO: fix this if possible*

### 3rd Party Developers

To initiate a 3rd party gadget developer prior to public release they should be added to the `3rd-party-gadget-developer` group on GitHub. They should also, at minimum, be told about the `versal docs`.
