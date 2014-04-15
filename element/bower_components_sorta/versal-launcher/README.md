# versal-text

Contenteditable element, that allows author to enter text/cml content inside.

## data-attributes

### data-content

Stores content, serialized to CML json.

How do we pass attributes to element?

Ideally, we have one event: `attributeChanged`, that goes from player to the gadget and another `setAttribute`, that goes from gadget to the player.

One-way (readonly) attributes:

- editable
- height

Data-attributes (you can `setAttribute` data-* only if gadget is editable).

- data-*

Learner attributes:

- user-*

Gadget has
