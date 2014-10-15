# react-coffeescript-glue

Write pretty React components in Coffeescript.

This is what your render function could look like in Coffeescript, using this repo:

```coffeescript
render: ->
  _div ['some-button-container'],
    _button [
      'some-button'
      'some-button-active' if @state.active
      onClick: => @setState active: !@state.active
    ],
      'Some button caption'

    if @state.active
      _i [], 'Button is active'
    else
      'Button is inactive'
```

- We globally expose all the `React.DOM` methods prefixed with an underscore: `_div`, `_button`, and so on, for convenience.
- We allow an array as the first argument, combining all objects in that array. Totally optional to use.
- If you do use the array, you can use strings directly instead of using `className`, all strings are combined.
- Using strings in the array is short, convenient, and lets you use nice syntax such as `'some-button-active' if @state.active`.
- Always using the array syntax as convention makes it less likely to get caught by Coffeescript bugs, as it's more explicit where the options argument ends.

## Usage

Using bower:

```
bower install --save react-coffeescript-glue
```

Then include in your HTML:

```html
<script src="bower_components/react-coffeescript-glue/react-coffeescript-glue.js"></script>
```

Or use RequireJS or so, we include a [Universal Module Definition](http://bob.yexley.net/umd-javascript-that-runs-anywhere/).
