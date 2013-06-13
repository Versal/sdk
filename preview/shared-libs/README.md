# Shared libs

Here's some commonly-used JavaScript libraries, and appropriate AMD shims. Also
includes a little script for injecting these semi-delicately into existing
require.js configs.

## Contents
<table>
  <tr>
    <th>Library</th><th>Version</th><th>Shim Name</th>
  </tr>
  <tr>
    <td>Backbone</td>
    <td>1.0.0</td>
    <td>cdn.backbone</td>
  </tr>
  <tr>
    <td>Backbone.Marionette</td>
    <td>1.0.2</td>
    <td>cdn.marionette</td>
  </tr>
  <tr>
    <td>jQuery</td>
    <td>1.9.1</td>
    <td>cdn.jquery</td>
  </tr>
  <tr>
    <td>Lodash</td>
    <td>1.1.1</td>
    <td>cdn.lodash</td>
  </tr>
  <tr>
    <td>Processing.js</td>
    <td>1.4.1</td>
    <td>cdn.processing</td>
  </tr>
  <tr>
    <td>Raphaël</td>
    <td>2.1.0</td>
    <td>cdn.raphael</td>
  </tr>
  <tr>
    <td>Underscore</td>
    <td>1.4.4</td>
    <td>cdn.underscore</td>
  </tr>
  <tr>
    <td>jQuery UI</td>
    <td>1.10.2</td>
    <td>cdn.jqueryui</td>
  </tr>
</table>

## Usage
First, do this. Replace the last "shared-libs" with the directory you'd like to
put these submodules in.

    git submodule add git://github.com/Versal/shared-libs.git shared-libs

Then, somewhere in your application (again, replace the string 'shared-libs'
with the location you specified previously):

    require ['shared-libs/config'], (registerCdn) -> registerCdn('shared-libs')

Then, things can define their dependencies like so:

    define ['cdn.lodash'], (_) -> alert _.random(1, 100)

## Todo
- Host these on a real CDN.
- Become a require plugin (`cdn!*` rather than `cdn.*`)
