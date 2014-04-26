This repo contains the new decoupled launcher for iframe gadgets. We are still moving things around quite a bit, so please bear with us! :-)

Below you can find the API documentation.

# Gadget API

## Player Events

Events triggered by the player.

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

Indicate changed editability of the gadget. Sent once before `attached` and then in response to user actions.

```
{
  event: 'editableChanged'
  data: {
    editable: true
  }
}
```

### attached

Ready to render - sent after all 'bootstrapping' attribute events.

```
{
  event: 'attached'
}
```

### detached

Gadget has been removed from the DOM.

```
{
  event: 'detached'
}
```

## Gadget Events

Events triggered by gadgets.

### startListening

Reports to the player, that gadget is ready to receive events. Player responds with a series of events. See below.

```
{
  event: 'startListening'
}
```

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

Send analytics and tracking information.<br>
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

Throw a rendering-time error.

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

# Challenges API

## Player Events

Events triggered by the player.

### challengesChanged

Delivering the initial or updated set of challenges (PATCH).

```
{
  event: 'challengesChanged'
  data: {
    challenges: [{...}, {...}, {...}]
  }
}
```

### scoresChanged

Delivering the initial or updated learner scores (PATCH).

```
{
  event: 'scoresChanged'
  data: {
    scores: [1, 0, 1]
    totalScore: 1,
    responses: [true, true, false]
  }
}
```

## Gadget Events

Events triggered by gadgets.

### setChallenges

Persisting an updated set of challenges (PATCH). Player replies with the confirmation message `challengesChanged`.

```
{
  event: 'setChallenges'
  data: {
    challenges: [{...}, {...}, {...}]
  }
}
```

### scoreChallenges

Performs scoring of user's responses against the current set of challenges (POST). Player replies with the confirmation message `scoresChanged`.

```
{
  event: 'scoreChallenges'
  data: {
    responses: [true, true, false]
  }
}
```
