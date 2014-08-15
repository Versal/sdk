# Versal Legacy Launcher

This launcher is used to launch old Versal gadgets, that used an API that was never used publicly.

## TODO

- Launcher still depends on RequireJS being available. The tests already don't really depend on this, but gadgets still do. We should find a way of consolidating that inside the gadget. The question is, however, how this would play with projects that do use RequireJS themselves.
- The launcher still depends on "cdn.*" RequireJS modules, as found in https://github.com/Versal/shared-libs. We need to find a way to include them inside this package.
