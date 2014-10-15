# versal-react-sidebar

The sidebar / table of contents, extracted from the player and to be used in other projects.

## Usage

`bower install --save Versal/react-sidebar`, and be sure to pin it to a version.

Then include all the dependencies; `react`, `react-coffeescript-glue`, and `fontawesome`. Include `sidebar.js`, and load it with AMD or as a global (`SidebarCourseComponent`).

Then include `sidebar.styl`, and be sure to first load all necessary variables, see `default-variables.styl`. Also note that the player currently uses the proprietary font Avernir, so you would need to add that as a dependency to get the exact same look.

You can also use `sidebar.css` which uses these default variables, but this is not recommended as the default variables in this repo may be outdated.

`demo.html` shows a basic version of the sidebar.

## Developing

Update `sidebar.js` and `sidebar.css` using `npm install`.

To test, run `bower install`, which will install dependencies in `../`, and then open `demo.html`. (The `../` trick ensures the demo also works when this repo is installed as a dependency.)

## TODO

- Tests.
- Dependent on older version of Font Awesome, update to latest.
- Depend on some set of basic Versal styles, preferably using CSS variables, not Stylus. And get Avenir in there.
- Extract native drag-and-drop logic in React to a separate library
