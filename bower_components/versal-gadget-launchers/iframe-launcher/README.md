# Versal Iframe Launcher [![Build Status](https://travis-ci.org/Versal/iframe-launcher.svg?branch=master)](https://travis-ci.org/Versal/iframe-launcher) [![Code Climate](https://codeclimate.com/github/Versal/iframe-launcher.png)](https://codeclimate.com/github/Versal/iframe-launcher)

This launcher is used to launch Versal iframe gadgets.

## Usage

1. Install [versal-component-runtime](https://github.com/Versal/component-runtime) and versal-iframe-launcher:
```
bower install versal-component-runtime versal-gadget-launchers
```

2. Include `versal-component-runtime` as a script in the HEAD section of your page:
```
<script src="bower_components/versal-component-runtime/dist/runtime.min.js"></script>
```

3. Link iframe-launcher.html in the HEAD section of your page:
```
<link rel="import" href="bower_components/versal-gadget-launchers/iframe-launcher/iframe-launcher.html" />
```

4. Embed `<versal-iframe-launcher>` in the page like this:
```
<versal-iframe-launcher
  src="https://stack.versal.com/api2/gadgets/am/hello-world/0.1.6/index.html"
  data-config='{ "word": "test", "color": "red", "imageid": "3f6ba8d9-b464-46a9-8fa5-fec68a28a052" }'
  data-environment='{ "assetUrlTemplate": "https://static.versal.com/assets/<%= id %>" }'
</versal-iframe-launcher>
```

Complete example is available at `demo.html`.

# Gadget API

To use Versal Gadget API first of all you have to send 'startListening' event. You can send this event after all your modules are loaded and initialized, and gadget is ready to do the job.

### startListening

    window.parent.postMessage({ event: 'startListening' });

Reports to the player, that gadget is ready to receive events. Player responds with a series of events. See below.

```
{
  event: 'startListening'
}
```

## Player Events

After receiving startListening event from the gadget, player responds with the following events:

### environmentChanged

Sends environment variables to the gadget once immediately after receiving `startListening` from the gadget.<br/><br/> Currently there is only one environment variable: `assetUrlTemplate` Use this template to obtain asset URL by id.

```
{
  event: 'environmentChanged'
  data: {
    assetUrlTemplate: '//static.versal.com/assets/<%= id %>'
  }
}
```

### attributesChanged

Delivering the initial or updated set of attributes (PUT).

```
{
  event: 'attributesChanged'
  data: {
    foo: 'bar'
    baz: 2
  }
}
```

### learnerStateChanged

Delivering the initial or updated learner state (PUT).

```
{
  event: 'learnerStateChanged'
  data: {
    foo: 'bar'
    baz: 2
  }
}
```

### editableChanged

Indicate changed editability of the gadget. Sent once after `startListening`, and then in response to user actions.

```
{
  event: 'editableChanged'
  data: {
    editable: true
  }
}
```

## Gadget commands

Commands, that gadget can trigger to inform player about changes.

### setAttributes

Persisting an updated set of attributes (PATCH). Player replies with the confirmation message `attributesChanged`.

```
{
  event: 'setAttributes'
  data: {
    foo: 'bar'
    baz: 2
  }
}
```

### setLearnerState

Persisting an updated set of learner attributes (PATCH). Player replies with the confirmation message `learnerStateChanged`.

```
{
  event: 'setLearnerState'
  data: {
    foo: 'bar'
    baz: 2
  }
}
```

### setHeight

Adjust the height of the gadget.

```
{
  event: 'setHeight'
  data: {
    pixels: 1337
  }
}
```

### setPropertySheetAttributes

Define an updated property sheet schema.

```
{
  event: 'setPropertySheetAttributes'
  data: {
    selectAmount: {
      type: 'Range',
      min: 100,
      max: 500,
      step: 20
    },
    chooseDay: {
      type: 'Select',
      options: ['Monday', 'Wednesday', 'Friday', 'Any day']
    }
  }
}
```

### setEmpty

Set the emptiness (placeholder) status of the gadget.

```
{
  event: 'setEmpty'
  data: {
    empty: true
  }
}
```

### track

Send analytics and tracking information. *Bubbles up the DOM tree.*<br>
@type (required) is the name of the tracking event.

```
{
  event: 'track'
  data: {
    @type: 'video-load-time'
    duration: 1234
  }
}
```

### error

Throw a rendering-time error. *Bubbles up the DOM tree.*

```
{
  event: 'error'
  data: {
    message: 'Everything broke!'
    stacktrace: 'Line 123: ...'
  }
}
```

### changeBlocking

Indicate a potential change in lesson blocked-ness (e.g. after an assessment is submitted).

```
{
  event: 'changeBlocking'
}
```

### requestAsset

Request a new asset from a user. When delivered, it will be saved in the field given by the `attribute` property, and a corresponding `attributesChanged` event will be fired.

```
{
  event: 'requestAsset'
  data: {
    type: 'image'
    attribute: 'myImage'
  }
}
```
