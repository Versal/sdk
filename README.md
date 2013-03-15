Versal Gadget SDK
===================

Installation
-------------------

If you want to make changes to the SDK install it from source:
```
git clone git@github.com:Versal/sdk
cd sdk
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
mkdir my-gadget
cd my-gadget
versal init
```

This will initialize a new gadget inside `my-gadget` folder.

```
versal preview
```

Run preview to see the gadget in action.

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

```
versal init [--template <TEMPLATE_NAME>] [--dir <DIRECTORY>]
```



Init command must be run inside the gadget directory. It initializes