# Versal Course Player

 Player's [prod branch](https://github.com/Versal/player/tree/prod) represents player as it appears on versal.com - the workflow for adding hotfixes to prod is [detailed here](https://docs.google.com/a/versal.com/document/d/11nVE9X0EIBEAbsDspOYAgPPLxqTzR1EUYc2fLEXLFgg/edit)

### Installation

As of [9e89083](https://github.com/Versal/player/commit/9e89083), player depends on [versal/shared-libs](https://github.com/Versal/shared-libs) to satiate its hunger for tasty, tasty dependencies. Fortunately, the shared libraries are now incorporated as a submodule:

    $ git submodule init
    $ git submodule update

### Dev configuration

To get the current version working correctly:

  1. Go to [https://versal.com/](https://versal.com/), signin, create a course, and grab your sessionId and courseId from the source.
  2. Copy `./app/config.default.json` to `~/.player.json` and update `sessionId` and `courseId` keys to valid values (also change other values if applicable. See "Config files" below.).
  3. Run `grunt`
  4. Interact with player at [http://localhost:3232](http://localhost:3232)

You can specify a config file other than `~/.player.json` with the `--config` flag

    grunt --config ~/.player.physics-learner.json

You can specify the development server port (defaults to 3232) with the `--port` flag

    grunt --port 3535

#### Config values

<dl>

<dt>
courseId
</dt>
<dd>
  <p>ID of course on the API specified in `apiUrl`</p>
  <p><em>default: 1</em></p>
</dd>

<dt>
sessionId
</dt>
<dd>
  <p>Session ID on the API specified in `apiUrl`</p>
  <p><em>default: invalid sessionId</em></p>
</dd>

<dt>
apiUrl
</dt>
<dd>
  <p>URL to an instance of stack</p>
  <p><em>default: https://stack.versal.com/api2</em></p>
</dd>

<dt>
config
</dt>
<dd>
  <p>Path to a RequireJS configuration file</p>
  <p><em>default: scripts/config</em></p>
</dd>

<dt>
stubbed
</dt>
<dd>
  <p>Boolean indicating that grunt should build the stubbed version of the player. Stubbed version currently includes a fake asset picking view for use by the SDK</p>
  <p><em>default: false</em></p>
</dd>

</dl>

#### JS API

Player depends on the api (http://github.com/Versal/api2). API resides in app/scripts/plugins/vs.api.js and should never be changed directly. The process of changing API should follow:

  1. Change the API, create the tests, make them pass
  2. Issue a pull-request to the API
  3. Convince somebody to accept your pull request
  4. Then run `grunt build & grunt deploy` on API part to copy the built version of API into the player folder
  5. Issue a pull-request to update the API in the player repo.

# Building the player

### Clone + Build

Pulling down the repository and building the player is a 4.5 step process:

```
git clone git@github.com:Versal/player.git && cd player
git submodule update --init
npm install
grunt build
```

Great! Player is now built in `player-bundle.js` in the `./dist` directory.

### Launcher setup

Since bb96f023d0, an iframe version of the player may be launched in a containing `<div>` using:

     <div class="my-player-class">
       <script src="http://stack.versal.com/player2/scripts/versal.js"></script>
     </div>

You will need to inject a session ID when the player's `player:ready` event is triggered:

    <script>
      var origin = 'http://localhost:3232',
          sid    = '12345';

      window.addEventListener('message', function (e) {

        // Check origin and event
        if (e.origin == origin && JSON.parse(e.data).event == 'player:ready') {

          // Fire up the player
          e.source.postMessage(JSON.stringify({
            event: 'player:launch',
            api: 'http://stack.versal.com/api2',
            course: '9',
            sid: sid
          }), origin);
        }
      });
    </script>

The iframe created may then be referenced by its class name: `versal-embed-COURSE`, where `COURSE` is the course being launched:

    jQuery(document).on('ready', function ($) {
      var $iframe = $('.versal-embed-9');
      $iframe.height($('my-player-class').height());
    });

    var sid = '12345';
    window.addEventListener('message', function (e) {
      var data, loc = window.location;
      if (e.origin == (loc.protocol + "//" + loc.host)) {
        data = { event: 'player:launch', sessionId: sid };
        e.source.postMessage(JSON.stringify(data), '*');
      }
    });

#### Old Launcher setup

The built version of the player depends on a somewhat cumbersome sequence of styles and scripts. Until we clean these up, a player served at `/static` can be launched with:

```
<div class="player-container"></div>
<link rel="stylesheet" href="/static/styles/vendor/jquery-ui.css">
<link rel="stylesheet" href="/static/styles/vendor/bootstrap.css">
<link rel="stylesheet" href="/static/styles/vendor/myfonts-combined.css">
<link rel="stylesheet" href="/static/styles/vendor/clayer.css">
<link rel="stylesheet" href="/static/styles/vendor/tooltips.css">
<link rel="stylesheet" href="/static/styles/main.css">

<script src="/static/scripts/plugins/vs.ui.js"></script>
<script src="/static/scripts/libs/require.js"></script>
<script>

// require shared-libs, player dependencies, and the compiled player
require(['/static/scripts/shared-libs/config.js'], function (registerCdn) {
  registerCdn('/static/scripts/shared-libs');
  require(['cdn.marionette'], function () {
    require(['/static/scripts/player-bundle.js']);
  });
});

// callback: launch the player
window.onPlayerReady = function (PlayerApplication) {
  window.Player = new PlayerApplication({
    baseUrl: '/static/',
    requireRoot: '/static/',
    container: '.player-container',
    courseId: 12345,
    api: {
      apiUrl: 'http://stack.versal.com/api2',
      sessionId: 'your-session-id'
    }
  });
};
</script>
```

An equivalent launcher for populating the player configuration with `postMessage` fields (ala driverpermit.com) is accessible [here](https://gist.github.com/rjz/a0db4fed1e347ad1ab15)
