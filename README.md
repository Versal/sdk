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


Usage
------------------

```
versal create hello_gadget
cd hello_gadget
```

This will initialize a new gadget inside `hello_gadget` folder.

```
versal preview
```

Run preview to see the gadget in action. Note that you will see any other gadgets that you've developed in their compiled versions. (For now) You can remove these by editing the .versal file in your home directory.

```
versal test
```

Runs mocha tests for the gadget. Tests must be contained inside `test` folder. Mocha must be installed globally. To install mocha run `npm install -g mocha`.

```
versal publish
```

Valid Versal account is required to complete this task. You will be prompted to enter email and password to publish the gadget. This task will run internal tasks "authorize", "validate", "compile", "compress", "upload" sequentially.

Commands
--------------------

### Create
```
versal create <gadget_name>
```

Init command must be run inside the gadget directory. It copies SDK folder from the current version of sdk and all files from the specified template. Calling `versal init` in existing folder will only rewrite `sdk` folder and leave other files unmodified.

#### Options

`force`
Will overwrite existing files, if called inside the existing folder.

`clean`
Will clean a folder before copying `sdk` and template files.

### Preview
```
versal preview
```

Launches `connect` web server in the gadget folder.

### Validate

Will validate gadget folder structure and manifest fields.

### Publish

Will `compile` gadget into `dist` folder, `compress` it into bundle.zip, authorize using versal account and `upload` gadget to the specified endpoint.

### Gadget Documention

```
versal docs
```

You can view gadget documentation at [http://localhost:4000/docs](http://localhost:4000/docs)

### SDK Development

To build up a new version of documentation:

Building docs
-------------

    rm -rf node_modules
    npm install
    grunt exec:build-docs

*Note: unfortunately must remove node_modules to make sure the latest `gadget-docs`*
*TODO: fix this if possible*

### 3rd Party Developers

To initiate a 3rd party gadget developer prior to public release they should be added to the `3rd-party-gadget-developer` group on GitHub. They should also, at minimum, be told about the `versal docs`.
