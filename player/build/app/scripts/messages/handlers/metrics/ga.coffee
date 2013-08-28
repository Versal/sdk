define [], ->

  _gaq = _gaq || []
  _gaq.push ['_setAccount', 'UA-34216821-1']
  _gaq.push ['_setDomainName', 'versal.com']
  _gaq.push ['_trackPageview']

  ga = document.createElement 'script'
  ga.type = 'text/javascript'
  ga.async = true
  ga.src = ((if 'https:' is document.location.protocol then 'https://ssl' else 'http://www')) + '.google-analytics.com/ga.js'
  s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore ga, s

  (category, action, data) ->
    _gaq.push ['_trackEvent', category, action, JSON.stringify(data)]

