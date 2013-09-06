(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['cdn.underscore', './default_asset_picker', 'models/video', 'text!views/stubbed/asset_picker/assets.json'], function(_, DefaultAssetPickerView, Video, assetsJsonString) {
    var StubbedAssetPickerView, oneColumnTemplate, twoColumnTemplate;
    twoColumnTemplate = "<table class=\"sample-files\">\n  <tr>\n  <% _.each(files, function(file, index) { %>\n    <td class=\"file\"><a href=\"#\"><%= file %></a></td>\n    <% if ((index % 2 == 1) && (index != (files.length - 1))) { %>\n      </tr>\n      <tr>\n    <% } %>\n  <% })%>\n  </tr>\n</table>";
    oneColumnTemplate = "<table class=\"sample-files\">\n  <% _.each(files, function(file, index) { %>\n    <tr>\n      <td class=\"file\"><a href=\"#\"><%= file %></a></td>\n    </tr>\n  <% })%>\n</table>";
    return StubbedAssetPickerView = (function(_super) {

      __extends(StubbedAssetPickerView, _super);

      function StubbedAssetPickerView() {
        return StubbedAssetPickerView.__super__.constructor.apply(this, arguments);
      }

      StubbedAssetPickerView.prototype.events = _.extend({}, DefaultAssetPickerView.prototype.events, {
        'click .sample-files a': 'onChooseSampleImage'
      });

      StubbedAssetPickerView.prototype.onChooseSampleImage = function(e) {
        var asset, assets, assetsJson, contentType, json, original, title;
        assetsJson = JSON.parse(assetsJsonString);
        json = assetsJson[this.type];
        assets = new vs.api.Assets(json, {
          parse: true
        });
        title = $(e.currentTarget).text();
        asset = assets.findWhere({
          title: title
        });
        original = asset.representations.findWhere({
          original: true
        });
        contentType = original.get('contentType');
        asset.set({
          contentType: contentType
        });
        this.showStatus('Processing complete');
        this.onUploadSuccess(asset);
        return this.onUseClick();
      };

      StubbedAssetPickerView.prototype.onChooseClick = function(e) {
        return this.noop(e);
      };

      StubbedAssetPickerView.prototype.onModalClick = function(e) {};

      StubbedAssetPickerView.prototype.sampleFileNames = function() {
        return {
          image: ["landscape.jpg", "portrait.jpg", "short-and-wide.jpg", "tall-and-skinny.jpg", "small-landscape.jpg", "small-portrait.jpg", "small-square.jpg", "large-square.jpg"],
          video: ["small-video.mp4", "medium-video.mp4", "large-video.mp4"]
        };
      };

      StubbedAssetPickerView.prototype.sampleFiles = function(fileType) {
        return _.map(this.sampleFileNames()[fileType], function(name) {
          return name.split('.')[0].replace(/\-/g, ' ');
        });
      };

      StubbedAssetPickerView.prototype.sampleFilesTemplate = function(type, data) {
        var template;
        template = type === 'image' ? twoColumnTemplate : oneColumnTemplate;
        return _.template(template)(data);
      };

      StubbedAssetPickerView.prototype.onRender = function() {
        var files, filesMarkup;
        this.$el.find('.drop-blurb').text("choose a sample file");
        this.$el.find('.drop-image').hide();
        files = this.sampleFiles(this.type);
        filesMarkup = this.sampleFilesTemplate(this.type, {
          files: files
        });
        this.$el.find('.choose-overlay').prepend(filesMarkup);
        this.$el.find('.sample-files').css({
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 2,
          width: 478,
          height: 170,
          marginTop: 10
        });
        return StubbedAssetPickerView.__super__.onRender.apply(this, arguments);
      };

      return StubbedAssetPickerView;

    })(DefaultAssetPickerView);
  });

}).call(this);
