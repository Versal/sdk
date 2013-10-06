require.config

  baseUrl: '/test',

  # In the testing configuration variation, the only dependency is the mocha runner.
  # Each spec is then required as a dependency for the runner script
  deps: [ "runner/mocha" ]

  paths:
    libs: "../scripts/libs",
    plugins: "../scripts/plugins",
    vendor: "../scripts/vendor",

    # Path to test helpers
    helpers: "helpers",

    # Path to application scripts
    app: "../scripts",
    messages: "../scripts/messages",
    models: "../scripts/models",
    views: "../scripts/views",
    collections: "../scripts/collections",
    components: "../scripts/components",
    gadgets: "../scripts/gadgets",
    templates: "../templates"

    # Libraries.
    text: "../scripts/libs/text"
    clayer: "../scripts/libs/clayer"
    tags: "../scripts/libs/tags"
    'css-parse': '../scripts/libs/css-parse'
    'css-stringify': '../scripts/libs/css-stringify'
    modernizr: '../scripts/libs/modernizr.custom.14477'

  shim:
    'plugins/backbone.filter':
      deps: ['cdn.backbone']

    'plugins/vs.ui':
      deps: ['cdn.jquery']

    'plugins/vs.api':
      deps: ['cdn.lodash', 'cdn.backbone']

    'plugins/vs.collab':
      deps: ['cdn.lodash', 'cdn.backbone']

    'libs/backbone-forms':
      deps: ['cdn.backbone']

require ['../scripts/shared-libs/config'], (registerCdn) -> registerCdn('../scripts/shared-libs')
