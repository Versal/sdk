require.config

  waitSeconds: 0 # Wait indefinitely for module timeout

  paths:
    libs: 'libs'
    plugins: 'plugins'
    toc: '../toc'
    app: '../scripts'

    text: 'libs/text'
    templates: '../templates'
    'backbone-forms':            'libs/backbone-forms'
    'backbone-forms.bootstrap':  'libs/backbone-forms.bootstrap'
    clayer: 'libs/clayer'
    tags: 'libs/tags'
    'css-parse': 'libs/css-parse'
    'css-stringify': 'libs/css-stringify'
    modernizr: 'libs/modernizr.custom.14477'
    
  shim:
    'plugins/vs.ui':
      deps: ['cdn.jquery']

    'plugins/vs.api':
      deps: ['cdn.jquery', 'cdn.lodash', 'cdn.backbone']

    'plugins/backbone.filter':
      deps: ['cdn.backbone']

    'plugins/backbone.move':
      deps: ['cdn.backbone']

    'plugins/backbone.prioritize':
      deps: ['cdn.backbone']

    'plugins/backbone.associate':
      deps: ['cdn.backbone']

    clayer:
      exports: 'clayer'

# Start things off with the launcher script
require ['shared-libs/config'], (registerCdn) -> registerCdn('shared-libs')
require ['launcher']
