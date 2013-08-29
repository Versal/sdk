define ['css-parse', 'css-stringify'], (parse, stringify) ->
  registered = {}

  # Handler for "style:register" messages
  #
  # `message`:
  #   * `href`: a link to the stylesheet
  #   * `key`: the key to use for the stylesheet
  #
  handler = (message, options) ->

    return unless href = message.href
    key = message.key
    files = message.files

    return if registered[href]
    registered[href] = true

    # Retrieve the CSS + add the style rules
    xhr = $.get href, dataType: 'text'
    xhr.done _.wrap handler.addStyle, (func, data) ->
      func data, key, files

    xhr.fail -> registered[href] = false

  handler.namespaceSelector = (key, selector) ->
    key + ' ' + selector

  handler.namespaceRules = (key, rules) ->
    for rule in rules
      if rule.selectors?
        rule.selectors = (handler.namespaceSelector(key, s) for s in rule.selectors)
      else if rule.rules?
        handler.namespaceRules key, rule.rules

  # Namespace all rules in the Gadget's CSS
  handler.namespaceCss = (key, data) ->
    ast = parse(data)
    handler.namespaceRules(key, ast.stylesheet.rules)
    stringify ast, compress: true

  handler.rewriteAssetUrls = (css, files) ->
    _.each files, (cdnFile, localFile) ->
      localFileRE = new RegExp(localFile, "g")
      css = css.replace localFileRE, cdnFile
    css

  # Add or replace the gadget's <style> tag
  # Note that it's a very, very not good idea to drop unsanitized CSS
  # into userland.. http://namb.la/popular/tech.html
  handler.addStyle = (data, key, files) =>
    cssClass = "style-#{key}"
    $style = $("style.#{cssClass}")
    if $style.length < 1
      $style = $('<style />').addClass cssClass
    data = handler.rewriteAssetUrls data, files
    $style.text handler.namespaceCss ".#{key}", data
    $style.appendTo('body')

  handler

