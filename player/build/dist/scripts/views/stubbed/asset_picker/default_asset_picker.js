(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['app/mediator', 'plugins/tracker', 'models/video', 'cdn.marionette', 'text!templates/asset_picker/asset_picker.html'], function(mediator, tracker, Video, Marionette, template) {
    var AssetPickerView, Modal;
    Modal = (function(_super) {

      __extends(Modal, _super);

      function Modal() {
        this.onKeyDown = __bind(this.onKeyDown, this);
        return Modal.__super__.constructor.apply(this, arguments);
      }

      Modal.prototype.close = function() {
        $(document).off('keydown', this.onKeyDown);
        $(window).off('dragenter dragexit dragover dragleave drop', this.noop);
        return this.remove();
      };

      Modal.prototype.onBackdropClick = function() {
        return this.close();
      };

      Modal.prototype.onModalClick = function(e) {
        return e.stopPropagation();
      };

      Modal.prototype.onCloseModalClick = function() {
        return this.close();
      };

      Modal.prototype.onKeyDown = function(e) {
        if (e.keyCode === 27) {
          return this.close();
        }
      };

      Modal.prototype.onRender = function() {
        $(document).on('keydown', this.onKeyDown);
        return $(window).on('dragenter dragexit dragover dragleave drop', this.noop);
      };

      Modal.prototype.noop = function(e) {
        e.stopPropagation();
        return e.preventDefault();
      };

      Modal.prototype.modalEvents = {
        'click': 'onModalClick',
        'click .js-close': 'onCloseModalClick',
        'click .modal-backdrop': 'onBackdropClick'
      };

      return Modal;

    })(Marionette.ItemView);
    return AssetPickerView = (function(_super) {

      __extends(AssetPickerView, _super);

      function AssetPickerView() {
        this.onUploadError = __bind(this.onUploadError, this);

        this.onAssetRefetchError = __bind(this.onAssetRefetchError, this);

        this.onAssetRefetch = __bind(this.onAssetRefetch, this);

        this.onUploadSuccess = __bind(this.onUploadSuccess, this);

        this.onDrop = __bind(this.onDrop, this);

        this.templateHelpers = __bind(this.templateHelpers, this);
        return AssetPickerView.__super__.constructor.apply(this, arguments);
      }

      _.extend(AssetPickerView.prototype, tracker('Asset Picker'));

      AssetPickerView.prototype.template = _.template(template);

      AssetPickerView.prototype.templateHelpers = function() {
        var _this = this;
        return {
          getType: function() {
            return _this.type;
          }
        };
      };

      AssetPickerView.prototype.initialize = function(options) {
        this.options = options;
        this.type = this.options.type;
        if (!this.type) {
          throw new Error("Asset type is required");
        }
        return this.formats = this.type === 'image' ? ['jpg', 'jpeg', 'png'] : this.type === 'video' ? ['mp4', 'ogg', 'webm', 'avi', 'mov'] : void 0;
      };

      AssetPickerView.prototype.ui = {
        preview: '.preview-region',
        filePreview: '.file-preview',
        uploading: '.uploading-overlay',
        choose: '.choose-overlay',
        status: '.status-message',
        useButton: '.js-use-file',
        spinner: '.uploading-spinner',
        hiddenUploader: '.hidden-uploader',
        videoInput: '.video-link'
      };

      AssetPickerView.prototype.events = function() {
        return _.extend({
          'click .choose-overlay': 'onChooseClick',
          'dragenter .dropzone': 'onOverlayDragEnter',
          'dragleave .dropzone': 'onOverlayDragLeave',
          'dragenter .preview-region': 'onRegionDragEnter',
          'dragexit .dropzone': 'noop',
          'dragover .dropzone': 'noop',
          'drop .dropzone': 'onDrop',
          'click .js-use-file': 'onUseClick',
          'input .video-link': 'onVideoInputChange',
          'paste .video-link': 'onVideoInputChange'
        }, this.modalEvents);
      };

      AssetPickerView.prototype.onOverlayDragEnter = function(e) {
        this.ui.choose.addClass('dragenter');
        return e.preventDefault();
      };

      AssetPickerView.prototype.onOverlayDragLeave = function(e) {
        this.ui.choose.removeClass('dragenter fromRegion');
        if (this.hasFile) {
          this.ui.choose.hide();
        }
        return e.preventDefault();
      };

      AssetPickerView.prototype.onRegionDragEnter = function(e) {
        if (!this.hasFile) {
          return;
        }
        this.ui.choose.addClass('dragenter fromRegion');
        this.ui.choose.show();
        return e.preventDefault();
      };

      AssetPickerView.prototype.onDrop = function(event) {
        var e, _ref;
        e = event.originalEvent;
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer.files.length) {
          return this.onChooseComplete((_ref = e.dataTransfer.files) != null ? _ref[0] : void 0);
        }
      };

      AssetPickerView.prototype.showStatus = function(message, error) {
        if (error == null) {
          error = false;
        }
        this.ui.status.toggleClass('error', error);
        return this.ui.status.text(message);
      };

      AssetPickerView.prototype.showPreviewError = function(message) {
        return this.ui.filePreview.text(message);
      };

      AssetPickerView.prototype.showUploading = function() {
        this.ui.choose.hide();
        this.ui.uploading.show();
        if (!this.indicator) {
          this.indicator = new vs.ui.LoadingIndicator(this.ui.spinner, '#fff');
        }
        return this.showStatus('uploading...');
      };

      AssetPickerView.prototype.showChoose = function() {
        this.ui.uploading.hide();
        this.ui.choose.show();
        this.showStatus("Accepted file types: " + (this.formats.join(', ')));
        return this.hasFile = false;
      };

      AssetPickerView.prototype.showFilePreview = function(file) {
        var sizeMb,
          _this = this;
        sizeMb = file.size / (1024 * 1024);
        if (sizeMb > 5) {
          return this.showPreviewError('File too large to preview');
        }
        if (typeof FileReader !== "undefined" && FileReader !== null) {
          this.fr = new FileReader();
          this.fr.onload = function(e) {
            return _this.onPreviewLoaded.call(_this, e, file);
          };
          return this.fr.readAsDataURL(file);
        } else {
          return this.showPreviewError('No preview available');
        }
      };

      AssetPickerView.prototype.onPreviewLoaded = function(e, file) {
        var v;
        if (file.type.split('/')[0] !== this.type) {
          return this.showPreviewError('No preview available');
        } else if (this.type === "image") {
          return this.ui.filePreview.html($('<img>').attr('src', e.target.result));
        } else if (this.type === "video") {
          v = $('<video>')[0];
          if (!!(v.canPlayType && v.canPlayType(file.type).replace(/no/, ''))) {
            return this.ui.filePreview.html("<video preload='metadata' controls='controls'>\n  <source src='" + e.target.result + "'>\n</video>");
          } else {
            return this.showPreviewError('No preview available');
          }
        }
      };

      AssetPickerView.prototype.onUploadSuccess = function(asset) {
        var _base;
        this.ui.uploading.hide();
        this.assetJSON = _.extend(asset.toJSON(), {
          representations: asset.representations.toJSON()
        });
        if (asset.get('contentType').substr(0, 5) === 'video') {
          this.assetViewModel = new Video(this.assetJSON);
        }
        this.showStatus('processing...');
        if (typeof (_base = this.options).processing === "function") {
          _base.processing();
        }
        return this.checkProcessingStatus(asset);
      };

      AssetPickerView.prototype.checkProcessingStatus = function(asset) {
        return asset.fetch({
          success: this.onAssetRefetch,
          error: this.onAssetRefetchError
        });
      };

      AssetPickerView.prototype.onAssetRefetch = function(asset) {
        if (asset.representations.findWhere({
          available: false
        })) {
          return _.delay(this.checkProcessingStatus.bind(this), 3000, asset);
        } else {
          return this.onProcessingComplete();
        }
      };

      AssetPickerView.prototype.onAssetRefetchError = function(asset) {
        return this.showStatus('Server error', true);
      };

      AssetPickerView.prototype.onProcessingComplete = function(asset) {
        this.ui.useButton.prop('disabled', false);
        return this.showStatus('Processing complete');
      };

      AssetPickerView.prototype.onUploadError = function() {
        this.ui.uploading.hide();
        this.track('Asset upload error');
        return this.showStatus('Error uploading', true);
      };

      AssetPickerView.prototype.onChooseClick = function() {
        var _this = this;
        this.ui.hiddenUploader.one('change', function() {
          var _ref;
          return _this.onChooseComplete((_ref = _this.ui.hiddenUploader[0].files) != null ? _ref[0] : void 0);
        });
        return this.ui.hiddenUploader.click();
      };

      AssetPickerView.prototype.onChooseComplete = function(file) {
        var asset, attributes, contentType, extension;
        if (!file) {
          return this.showStatus('No file chosen', true);
        }
        extension = _.last(file.name.split('.'));
        if (!_.contains(this.formats, extension.toLowerCase())) {
          return this.showStatus("Unsupported file type chosen. Acceptable formats:          " + (this.formats.join(', ')), true);
        }
        contentType = file.type || ("" + this.type + "/x-" + extension);
        attributes = {
          title: 'New File',
          tags: [this.type],
          content: file,
          contentType: contentType
        };
        asset = new vs.api.Asset;
        asset.save(attributes, {
          upload: true,
          success: this.onUploadSuccess,
          error: this.onUploadError
        });
        this.showUploading();
        this.ui.videoInput.css({
          "visibility": "hidden"
        });
        this.showFilePreview(file);
        return this.hasFile = true;
      };

      AssetPickerView.prototype.onUseClick = function() {
        this.options.result(this.assetViewModel || this.assetJSON);
        this.close();
        return this.track('Use asset', {
          assetJSON: this.assetJSON
        });
      };

      AssetPickerView.prototype.onVideoInputChange = function() {
        var input, vimId, ytId;
        input = this.ui.videoInput.val();
        if (this.oldInput === input) {
          return;
        }
        this.oldInput = input;
        if (input.length === 0) {
          this.render();
          this.ui.videoInput.focus();
          return;
        }
        ytId = this.getYoutubeId(input);
        vimId = this.getVimeoId(input);
        if (ytId || vimId) {
          this.ui.choose.hide();
          this.ui.useButton.prop('disabled', false);
          this.showStatus("");
        }
        if (ytId) {
          this.assetViewModel = new Video({
            type: "youtube",
            youtube_id: ytId
          });
          return this.ui.filePreview.html(this.assetViewModel.getEmbedCode());
        } else if (vimId) {
          this.assetViewModel = new Video({
            type: "vimeo",
            vimeo_id: vimId
          });
          return this.ui.filePreview.html(this.assetViewModel.getEmbedCode());
        } else {
          this.showStatus("That is not a valid YouTube or Vimeo video url", true);
          return this.ui.useButton.prop('disabled', true);
        }
      };

      AssetPickerView.prototype.getYoutubeId = function(input) {
        var ytRegex, _ref;
        ytRegex = /(?:(?:https?:\/\/)?(?:[a-zA_Z]{2,3}.)?)?(?:(?:youtube\.com\/watch\?)(?:[a-z=_&]+|(?:[\w\d\-\_\=]+&amp;(?:amp;)?))*v(?:&lt;[A-Z]+&gt;)?=|youtu.be\/)([0-9a-zA-Z\-\_]+)/;
        return (_ref = input.match(ytRegex)) != null ? _ref[1] : void 0;
      };

      AssetPickerView.prototype.getVimeoId = function(input) {
        var vimeoRegex, _ref;
        vimeoRegex = /(?:(?:https?:\/\/)?(?:[a-zA_Z]{2,3}.)?)?(?:vimeo\.com\/)([0-9]+)/;
        return (_ref = input.match(vimeoRegex)) != null ? _ref[1] : void 0;
      };

      AssetPickerView.prototype.onRender = function() {
        AssetPickerView.__super__.onRender.apply(this, arguments);
        this.ui.useButton.prop('disabled', true);
        this.showChoose();
        return this.track('Show');
      };

      return AssetPickerView;

    })(Modal);
  });

}).call(this);
