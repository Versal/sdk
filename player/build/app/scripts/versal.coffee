# Init iframe
playerFrame = (el, url, className, fullscreen) ->
  frame = document.createElement 'iframe'
  frame.src = url
  frame.className = className

  css = if fullscreen then {
    width: '100%'
    height: '100%'
    position: 'absolute'
    top: '0'
    left: '0'
  } else {
    height: el.offsetHeight + 'px'
  }

  css['border'] = '0'
  css['minWidth'] = '750px'

  for key, val of css
    frame.style[key] = val

  frame.marginheight = '0'
  el.appendChild frame

extractData = (c) ->
  result = {}
  for key in ['course', 'sid', 'api', 'whitelabel', 'embed', 'noEditable', 'revision']
    val = c.getAttribute "data-#{key}"
    result[key] = val if val

  result.fullscreen = (c.getAttribute('data-fullscreen') == "true")
  result

# Find script + work magic
for c in document.getElementsByTagName 'script'
  if c.src.indexOf('versal.js') > 0
    data = extractData c
    origin = c.src.match(/^(https?:\/\/.+)\/scripts\/versal.js/)[1]
    playerFrame c.parentNode, origin + '/iframe.html', "versal-embed-#{data.course}", data.fullscreen

    if data.hasOwnProperty('sid')
      launchPlayer = (e) ->
        data.event = 'player:launch'
        e.source.postMessage JSON.stringify(data), origin

      window.addEventListener 'message', (e) ->
        return unless origin.indexOf(e.origin) == 0
        switch JSON.parse(e.data).event
          when 'player:ready' then launchPlayer e
          else
            window.parent.postMessage e.data, '*'

