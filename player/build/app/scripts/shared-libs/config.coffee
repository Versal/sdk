define [], ->
  (path='cdn') ->
    config = 
      paths:
        'cdn.backbone': "backbone-1.0.0"
        'cdn.marionette': "backbone.marionette-1.0.2"
        'cdn.jquery': "jquery-1.9.1"
        'cdn.lodash': "lodash-1.1.1"
        'cdn.processing': "processing-1.4.1"
        'cdn.raphael': "raphael-2.1.0"
        'cdn.underscore': "underscore-1.4.4"
        'cdn.jqueryui': "jquery.ui-1.9.2"

      shim:
        'cdn.backbone':
          deps: ['cdn.underscore', 'cdn.jquery']
          exports: 'Backbone'

        'cdn.marionette':
          deps: ['cdn.backbone']
          exports: 'Backbone.Marionette'

        'cdn.jquery':
          exports: '$'

        'cdn.lodash':
          exports: '_'

        'cdn.processing':
          exports: 'Processing'

        'cdn.raphael':
          exports: 'Raphael'

        'cdn.underscore':
          exports: '_'

        'cdn.jqueryui':
          deps: ['cdn.jquery']
          exports: '$'

    for k,v of config.paths
      config.paths[k] = "#{path}/lib/#{v}"

    if typeof window != "undefined" && window.location.protocol == "https:"
      path = "https://c328740.ssl.cf1.rackcdn.com/mathjax/latest/MathJax.js?config=AM_HTMLorMML-full.js"
    else
      path = "http://cdn.mathjax.org/mathjax/2.0-latest/MathJax.js?config=AM_HTMLorMML-full.js"
    config.paths['cdn.mathjax'] =  path

    require.config config if require.config
    config