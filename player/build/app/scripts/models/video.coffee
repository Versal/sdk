# This view model exists solely for gadget developer convenience

define ['cdn.lodash', 'cdn.backbone'], (_, Backbone) ->

  class Video extends Backbone.Model

    defaults:
      type: 'asset' # 'youtube', 'vimeo'

    getEmbedCode: ->
      if @get("type") == 'asset'

        videos = _.filter @get("representations"), (rep) ->
          rep.contentType.indexOf("video/") == 0

        videos = _.sortBy videos, (v) ->
          if v.contentType == 'video/webm' then 0 else 1

        return _.template '''<video class="myVideo" preload="none" controls="controls">
          <% _.each(videos, function(vid) { %>
            <source src="<%= vid.location %>" type="<%= vid.contentType %>">
          <% }) %>
        </video>''', videos:videos

      else if @get("type") == 'youtube'
        return '<iframe id="ytplayer" type="text/html" width="100%" height="100%" src="http://www.youtube.com/embed/'+@get("youtube_id")+'" frameborder="0"/>'

      else if @get("type") == 'vimeo'
        return '<iframe src="http://player.vimeo.com/video/'+@get("vimeo_id")+'" width="100%" height="100%" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'

  window.vs = {} unless window.vs
  window.vs.Video = Video
  return Video