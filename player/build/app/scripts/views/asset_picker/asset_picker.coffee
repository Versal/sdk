define [
  'app/mediator'
  'plugins/tracker'
  'models/video'
  'cdn.marionette'
  'text!templates/asset_picker/asset_picker.html'
], (mediator, tracker, Video, Marionette, template) ->

  class Modal extends Marionette.ItemView
    close: ->
      $(document).off 'keydown', @onKeyDown
      $(window).off 'dragenter dragexit dragover dragleave drop', @noop
      @remove()

    onBackdropClick: ->
      @close()

    onModalClick: (e) ->
      e.stopPropagation()

    onCloseModalClick: ->
      @close()

    onKeyDown: (e) =>
      @close() if e.keyCode == 27

    onRender: ->
      $(document).on 'keydown', @onKeyDown
      $(window).on 'dragenter dragexit dragover dragleave drop', @noop

    noop: (e) ->
      e.stopPropagation()
      e.preventDefault()

    modalEvents:
      'click': 'onModalClick'
      'click .js-close': 'onCloseModalClick'
      'click .modal-backdrop': 'onBackdropClick'

  class AssetPickerView extends Modal
    _.extend @::, tracker('Asset Picker')

    template: _.template template

    templateHelpers: =>
      getType: => @type

    initialize: (@options) ->
      @type = @options.type
      throw new Error "Asset type is required" unless @type
      @formats =
        if @type == 'image' then ['jpg','jpeg','png']
        else if @type == 'video' then ['mp4','ogg','webm','avi','mov']

    ui:
      preview: '.preview-region'
      filePreview: '.file-preview'
      uploading: '.uploading-overlay'
      choose: '.choose-overlay'
      status: '.status-message'
      useButton: '.js-use-file'
      spinner: '.uploading-spinner'
      hiddenUploader: '.hidden-uploader'
      videoInput: '.video-link'

    events: -> _.extend {
      'click .choose-overlay': 'onChooseClick'
      'dragenter .dropzone': 'onOverlayDragEnter'
      'dragleave .dropzone': 'onOverlayDragLeave'
      'dragenter .preview-region': 'onRegionDragEnter'
      'dragexit .dropzone': 'noop'
      'dragover .dropzone': 'noop'
      'drop .dropzone': 'onDrop'
      'click .js-use-file': 'onUseClick'
      'input .video-link': 'onVideoInputChange'
      'paste .video-link': 'onVideoInputChange'
    }, @modalEvents

    onOverlayDragEnter: (e) ->
      @ui.choose.addClass 'dragenter'
      e.preventDefault()

    onOverlayDragLeave: (e) ->
      @ui.choose.removeClass 'dragenter fromRegion'
      @ui.choose.hide() if @hasFile
      e.preventDefault()

    onRegionDragEnter: (e) ->
      return unless @hasFile # Let overlay handle events
      @ui.choose.addClass 'dragenter fromRegion'
      @ui.choose.show()
      e.preventDefault()

    onDrop: (event) =>
      e = event.originalEvent
      e.stopPropagation()
      e.preventDefault()

      if e.dataTransfer.files.length
        @onChooseComplete e.dataTransfer.files?[0]

    showStatus: (message, error=false) ->
      @ui.status.toggleClass 'error', error
      @ui.status.text message

    showPreviewError: (message) ->
      @ui.filePreview.text message

    showUploading: ->
      @ui.choose.hide()
      @ui.uploading.show()
      @indicator = new vs.ui.LoadingIndicator(@ui.spinner, '#fff') unless @indicator
      @showStatus 'uploading...'

    showChoose: ->
      @ui.uploading.hide()
      @ui.choose.show()
      @showStatus "Accepted file types: #{@formats.join(', ')}"
      @hasFile = false

    showFilePreview: (file) ->
      sizeMb = file.size / (1024 * 1024)
      return @showPreviewError 'File too large to preview' if sizeMb > 5
      if FileReader?
        @fr = new FileReader()
        @fr.onload = (e) => @onPreviewLoaded.call @, e, file
        @fr.readAsDataURL file
      else
        @showPreviewError 'No preview available'

    onPreviewLoaded: (e, file) ->
      if file.type.split('/')[0] != @type
        # The uploaded file probably isn't the type we want. But let's give
        # them the benefit of the doubt (some browsers always report octet-stream)
        @showPreviewError 'No preview available'

      else if @type == "image"
        @ui.filePreview.html $('<img>').attr('src', e.target.result)

      else if @type == "video"
        v = $('<video>')[0]

        if !!(v.canPlayType && v.canPlayType(file.type).replace(/no/,''))
          @ui.filePreview.html """
            <video preload='metadata' controls='controls'>
              <source src='#{e.target.result}'>
            </video>
          """
        else
          @showPreviewError 'No preview available'

    onUploadSuccess: (asset) =>
      @ui.uploading.hide()
      @assetJSON = _.extend(asset.toJSON(), representations: asset.representations.toJSON())
      if asset.get('contentType').substr(0, 5) == 'video'
        @assetViewModel = new Video @assetJSON
      @showStatus 'processing...'
      @options.processing?()
      @checkProcessingStatus asset

    checkProcessingStatus: (asset) ->
      asset.fetch
        success: @onAssetRefetch
        error: @onAssetRefetchError

    onAssetRefetch: (asset) =>
      if asset.representations.findWhere { available: false }
        _.delay(@checkProcessingStatus.bind(@), 3000, asset)
      else
        @onProcessingComplete()

    onAssetRefetchError: (asset) =>
      @showStatus 'Server error', true

    onProcessingComplete: (asset) ->
      @ui.useButton.prop 'disabled', false
      @showStatus 'Processing complete'

    onUploadError: =>
      @ui.uploading.hide()
      @track 'Asset upload error'
      @showStatus 'Error uploading', true

    onChooseClick: ->
      @ui.hiddenUploader.one 'change', =>
        @onChooseComplete @ui.hiddenUploader[0].files?[0]
      @ui.hiddenUploader.click()

    onChooseComplete: (file) ->
      return @showStatus 'No file chosen', true unless file
      extension = _.last file.name.split '.'
      unless _.contains @formats, extension.toLowerCase()
        return @showStatus "Unsupported file type chosen. Acceptable formats:
          #{@formats.join(', ')}", true

      contentType = file.type || "#{@type}/x-#{extension}"

      attributes =
        title: 'New File'
        tags: [@type]
        content: file
        contentType: contentType

      asset = new vs.api.Asset
      asset.save attributes,
        upload: true
        success: @onUploadSuccess
        error: @onUploadError

      @showUploading()
      @ui.videoInput.css("visibility":"hidden")
      @showFilePreview file
      @hasFile = true

    onUseClick: ->
      # TO DO: Create view model for image and get rid of this ugly "|| @assetJSON"
      @options.result @assetViewModel || @assetJSON
      @close()
      @track 'Use asset', { @assetJSON }


    onVideoInputChange: ->
      input = @ui.videoInput.val()

      # ignore event if no change actually occcured
      return if @oldInput == input
      @oldInput = input

      # show default input if erased
      if input.length == 0
        @render()
        @ui.videoInput.focus()
        return

      #check for youtube/vimeo
      ytId = @getYoutubeId(input)
      vimId = @getVimeoId(input)

      if ytId || vimId
        @ui.choose.hide()
        @ui.useButton.prop 'disabled', false
        @showStatus("")
      if ytId
        @assetViewModel = new Video {type:"youtube", youtube_id: ytId}
        @ui.filePreview.html @assetViewModel.getEmbedCode()
      else if vimId
        @assetViewModel = new Video {type:"vimeo", vimeo_id: vimId}
        @ui.filePreview.html @assetViewModel.getEmbedCode()
      else
        @showStatus "That is not a valid YouTube or Vimeo video url", true
        @ui.useButton.prop 'disabled', true

    getYoutubeId: (input) ->
      ytRegex = /(?:(?:https?:\/\/)?(?:[a-zA_Z]{2,3}.)?)?(?:(?:youtube\.com\/watch\?)(?:[a-z=_&]+|(?:[\w\d\-\_\=]+&amp;(?:amp;)?))*v(?:&lt;[A-Z]+&gt;)?=|youtu.be\/)([0-9a-zA-Z\-\_]+)/
      input.match(ytRegex)?[1]

    getVimeoId: (input) ->
      vimeoRegex = /(?:(?:https?:\/\/)?(?:[a-zA_Z]{2,3}.)?)?(?:vimeo\.com\/)([0-9]+)/
      input.match(vimeoRegex)?[1]

    onRender: ->
      super
      @ui.useButton.prop 'disabled', true
      @showChoose()
      @track 'Show'
