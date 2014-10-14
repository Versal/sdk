# Versal gadget launchers

This contains the different launchers for gadgets on [Versal](versal.com). Currently we have the following types of launchers, which can be set by specifying `"launcher": "some-launcher-name"` in the gadget's `manifest.json`:

- [iframe](iframe-launcher), the Iframe Launcher. It loads a gadget's HTML file inside an iframe. This is the only launcher you can currently use for new gadgets.
- [legacy](legacy-launcher), the Legacy Launcher. It maintains compatibility for earlier developed gadgets. New gadgets cannot use this launcher.
- [component](component-launcher), the Component Launcher. It is used for some in-house gadgets that are used so often that the Iframe Launcher is too expensive. As Web Components standards advance we can open up usage for external gadgets as well, but not yet.

All code is licensed under the [MIT License](LICENSE).

## Chrome bug workaround

Normally you can load the launchers using HTML Imports, but since Chrome currently has a [bug in its implementation](https://code.google.com/p/chromium/issues/detail?id=421206) you could also use the JS/CSS files directly.
