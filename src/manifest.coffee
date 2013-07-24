module.exports =
  id: ->
    return "#{@username}/#{@name}@#{@version}"

  # Id, safe for CSS classes
  safeId: ->
    return @id().replace(/\./g, '').replace(/\//g, '-').replace(/@/g, '-')
