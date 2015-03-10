# Versal Gadget API [![Build Status](https://travis-ci.org/Versal/versal-gadget-api.svg?branch=master)](https://travis-ci.org/Versal/versal-gadget-api) [![Code Climate](https://codeclimate.com/github/Versal/versal-gadget-api/badges/gpa.svg)](https://codeclimate.com/github/Versal/versal-gadget-api) [![Bower version](https://badge.fury.io/bo/versal-gadget-api.svg)](http://badge.fury.io/bo/versal-gadget-api)

This repository is a collection of everything needed to create a Versal gadget. It contains:

- **versal-player-api.js:** Convenience library for talking to the Versal Player. It essentially wraps the [postMessage API](https://github.com/Versal/versal-gadget-launchers/tree/master/iframe-launcher).
- **versal-gadget-theme.css:** Some (very) basic styles. We will expand on this the future, to provide a consistent look across gadgets.
- **versal-challenges-api.js:** Very rudimentary scoring API. Use with caution. This will later include server-side scoring and tracking of scores.

## Usage

### Web components

To install all the APIs at once, you can use the new [HTML Imports API](http://www.polymer-project.org/platform/html-imports.html). We recommend using [Webcomponentsjs](https://github.com/webcomponents/webcomponentsjs) library as a lightweight polyfill for HTML imports.

In your gadget directory, run `bower install --save versal-gadget-api webcomponentsjs`.

Then add the following to the `<head>` of your your gadget's `versal.html`:

```
  <script src="bower_components/webcomponentsjs/webcomponentsjs-lite.min.js"></script>
  <link rel="import" href="bower_components/versal-gadget-api/versal-gadget-api.html">
```

### Vanilla JS/CSS

You can also install the different APIs in this repo manually. This is recommended if you're not planning on using Web Components, or want to keep the gadget's footprint as small as possible. See the documentation for the different APIs below for installation instructions.

## More resources and examples

- We have a **tutorial** to get you started, [Gadget development tutorial](https://versal.com/c/gadgets), which is a nicer version of [this file](docs/main.md)
- Use our **SDK** to create, preview, and upload your gadget: [Versal/sdk](https://github.com/Versal/sdk)
- Check out our **example gadgets**: [Versal/hello-world-gadget](https://github.com/Versal/hello-world-gadget), [Versal/highlightr-iframe](https://github.com/Versal/highlightr-iframe), [Versal/codepen-gadget](https://github.com/Versal/codepen-gadget), [Versal/chess-gadget](https://github.com/Versal/chess-gadget)

## versal-player-api.js

In you gadget directory, run `bower install --save versal-gadget-api`

Add the following to the `<head>` of your gadget's `versal.html`:

```
  <script src="bower_components/versal-gadget-api/versal-player-api.js"></script>
```

Then instantiate the player API object:

```
  var playerApi = new VersalPlayerAPI()
```

### Messages from gadget to player

All supported messages from gadget to player are exposed as methods on the player API object.

#### `startListening`

Indicates that the gadget has subscribed to the necessary messages and is ready to start receiving them. This would be typically the first message sent by the gadget to the player.

Example: `playerApi.startListening()`

#### `setHeight`

Assign height (in pixels) to the gadget's container.

Example: `playerApi.setHeight(420)`

#### `setHeightToBodyHeight`

Assign height to the gadget's container according to the current height of the gadget's `body` element. It uses `document.body.offsetHeight`: ["For the document body object, the measurement includes total linear content height [..] Floated elements extending below other linear content are ignored."](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetHeight)

Example: `playerApi.setHeightToBodyHeight()`

#### `watchBodyHeight`

Create a watching timer that will refresh the gadget container's height according to the current height of the gadget's `body` element. The value of the timer interval is given in milliseconds; the default value is 32.

Example: `playerApi.watchBodyHeight({interval: 200})`

#### `unwatchBodyHeight`

Stop dynamically adjusting the gadget container's height.

Example: `playerApi.unwatchBodyHeight()`

#### `setAttribute`

Persist a single attribute in the gadget configuration. This function can only be called while authoring.

Example: `playerApi.setAttribute('myColor', '#202020')`

#### `setAttributes`

Persist an object containing the changed attributes in the gadget configuration. Each key/value pair at the top level of the object will be persisted. Existing persisted keys will remain untouched so only the changed attributes need to be specified (not the entire gadget configuration). This function can only be called while authoring.

Example: `playerApi.setAttributes({ myColor: '#202020', myFont: 'Courier' })`

#### `setLearnerState`

Persist an object containing the gadget's current learner state. Each key/value pair at the top level of the object will be persisted. Existing persisted keys will remain untouched so only the the changed attributes need to be specified (not the entire learner state).

Example: `playerApi.setLearnerState({ lastOpened: 12, lastSelected: true })`

#### `setPropertySheetAttributes`

Define the gadget's property sheet.

Usage: `playerApi.setPropertySheetAttributes(descriptionObject)`

The argument is a object describing the attributes appearing in the property sheet.

For each attribute, we describe the attribute's name, the attribute's data type, and options specific to that data type.
Example:

```
playerApi.setPropertySheetAttributes({
     numberOfWords:  { type: 'Range', min: 100, max: 500, step: 20 },
     chosenAuthor: { type: 'Select',
                      options: ['Shakespeare', 'Hegel', 'Dickens', 'Lao Tzu']
                   }
})
```

Presently the player supports the following data types in property sheets:

* `Text`, `Number`, `TextArea`, `Checkbox`, `Color`: these types need no options.

Example: `{ type: 'TextArea' }`

*   `Checkboxes`, `Radio`, `Select`: these types take an array of `options`, representing the possible selection items. The `Select` type is a drop-down listbox.

Example: `{ type: 'Radio', options : ['Green', 'Yellow', 'Red' ] }`

*      `Date`, a date picker

Example: `{ type: 'Date', yearStart: 1990, yearEnd : 2038 }`

*      `DateTime`, a date/time picker

Example: `{ type: 'Datetime', 'yearStart : 1990, yearEnd : 2038, minsInterval : 60 }`

*      `Range`, a slider with a given range and step

Example: `{ type: 'Range', min: 100, max: 200, step: 10 }`

*      `Tags`, a selection of user-supplied tags

Example of using `Tags`:

```
{ type : 'Tags',
  options: ['music', 'movies', 'study', 'family', 'pets'],
  lowercase: true,
  duplicates: false,
  minLength: 3,
  maxLength: 20,
  updateAutoComplete: true
}
```

#### `error`

Tell the player to show a placeholder that indicates an error.

Example: `playerApi.error(new Error('Something bad happened to my gadget'))`

#### `track`

Track events generated by the gadget. These events can be, for example, learner's progress, or statistical information about the gadget's performance.

Example: `playerApi.track(name, data)`

The `name` specifies the kind of progress event. The `data` is an object describing that progress event.

#### `assetUrl`

Obtain the URL for an asset held by the Versal platform.

Example: `playerApi.assetUrl(assetId)`

The argument is the asset's ID string.

#### `requestAsset`

Ask the player to show a standard dialog for uploading an asset.

Usage: `playerApi.requestAsset({type: assetType, attribute: attrName}, function(assetData){...})`

Possible asset types are `image` and `video`.

`attribute` is the name of the gadget attribute in which the new asset's metadata will be stored after a successful upload. It is optional and defaults to `__asset__`. This is useful if you want to store the image data or URL yourself in an attribute that is an object or array.

The callback is optional. It will be invoked after a successful upload, and is called with the same `assetData` as is stored in the attribute.

Each newly uploaded asset is processed and stored on the Versal platform. The asset is described by the data structure of the form

```
{ id: 'xxxx',
   representations: [
      {
      id: 'yyyy',
      original: false,
      contentType: 'image/png',
      scale: '800x600'
      },
      {
      id: 'zzzz',
      original: true,
      contentType: 'image/png',
      scale: '1024x768'
      },
      ...
   ]
}
```

This data structure will be set as the value of the gadget's configuration attribute named `attrName` (which is given as a parameter in the `requestAsset` call). The gadget code should select a desired representation and use its ID in the `playerApi.assetUrl()` method in order to obtain the corresponding URL of the asset.

Since a successful upload will assign a new value for a gadget attribute, the gadget should expect an `attributesChanged` message after the user completes the upload. If the callback argument was given in the `requestAsset` call, the callback function will be also invoked with the new asset data structure as its argument.

### Messages from player to gadget

Subscribe to messages by using the `on` and `off` methods, for example:

`playerApi.on('message name', callback)`

`playerApi.off('message name', callback)`

Supported message names are `attributesChanged`, `learnerStateChanged`, and `editableChanged`.

#### `attributesChanged`

This message indicates to the gadget that some attributes have changed their values. This message is also sent to the gadget at initialization time, that is, shortly after the gadget sends `startListening` to the player. After initialization the event is fired again with the current gadget state:

  * after each call to `setAttributes`
  * whenever the author changes an attribute via a property sheet

Example: `playerApi.on('attributesChanged', function(attrs){...})`

The callback receives an object containing the new attributes for the gadget. The gadget should update its visual state accordingly.

#### `learnerStateChanged`

This message indicates to the gadget that some learner's state has changed. This message is also sent to the gadget at initialization time, that is, shortly after the gadget sends `startListening` to the player. After initialization the event is fired again with the current learner state after each call to `setLearnerState`.

Example: `playerApi.on('learnerStateChanged', function(learnerState){...})`

The callback receives an object containing the new learner state for the gadget. The gadget should update its visual state accordingly.

#### `editableChanged`

This message indicates to the gadget whether its configuration is currently being edited.

Example: `playerApi.on('editableChanged', function(attrs){...})`

The callback receives an object of the form `{editable: true/false}`. The value of `editable` describes the new editable state for the gadget. Accordingly, the gadget should switch its visual state to editing (the author's view) or to the learner's view.

## versal-gadget-theme.css

Add to the `<head>` of your gadget's `versal.html`:

```
  <link rel="stylesheet" href="bower_components/versal-gadget-api/versal-gadget-theme.css">
```

See [styleguide.html](styleguide.html) for some basic examples. Note that this is very much work in progress.

## versal-challenges-api.js

Add to the `<head>` of your gadget's `versal.html`:

```
  <script src="bower_components/underscore/underscore.js"></script>
  <script src="bower_components/versal-gadget-api/versal-challenges-api.js"></script>
```

This one is even more work in progress. For now, please refer to the [Hello World gadget](https://github.com/Versal/hello-world-gadget) for an example, or see our [tests](test/versal-challenges-api-spec.js).

## Development

To work on the CSS, just open [styleguide.html](styleguide.html) locally in a web browser.

The JS APIs are developed using [test-driven development](http://en.wikipedia.org/wiki/Test-driven_development). First run `npm install`, and then run `karma start`. Karma will run the tests whenever a file changes. You can also run the tests just once, using `npm test`.
