define [], ->
  (data) ->
    window.parent.postMessage JSON.stringify(data), '*'
