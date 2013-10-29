(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.underscore', 'cdn.backbone'], function(_, Backbone) {
    var Video;
    Video = (function(_super) {

      __extends(Video, _super);

      function Video() {
        return Video.__super__.constructor.apply(this, arguments);
      }

      Video.prototype.defaults = {
        type: 'asset'
      };

      Video.prototype.getEmbedCode = function() {
        var videos;
        if (this.get("type") === 'asset') {
          videos = _.filter(this.get("representations"), function(rep) {
            return rep.contentType.indexOf("video/") === 0;
          });
          videos = _.sortBy(videos, function(v) {
            if (v.contentType === 'video/webm') {
              return 0;
            } else {
              return 1;
            }
          });
          return _.template('<video class="myVideo" preload="none" controls="controls">\n  <% _.each(videos, function(vid) { %>\n    <source src="<%= vid.location %>" type="<%= vid.contentType %>">\n  <% }) %>\n</video>', {
            videos: videos
          });
        } else if (this.get("type") === 'youtube') {
          return '<iframe id="ytplayer" type="text/html" width="100%" height="100%" src="//www.youtube.com/embed/' + this.get("youtube_id") + '" frameborder="0"/>';
        } else if (this.get("type") === 'vimeo') {
          return '<iframe src="//player.vimeo.com/video/' + this.get("vimeo_id") + '" width="100%" height="100%" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
        }
      };

      return Video;

    })(Backbone.Model);
    if (!window.vs) {
      window.vs = {};
    }
    window.vs.Video = Video;
    return Video;
  });

}).call(this);
