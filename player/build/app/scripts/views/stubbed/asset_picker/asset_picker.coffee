define [
  'cdn.underscore'
  './default_asset_picker'
  'models/video'
  'text!views/stubbed/asset_picker/assets.json'
], (_, DefaultAssetPickerView, Video, assetsJsonString) ->

  twoColumnTemplate = """
    <table class="sample-files">
      <tr>
      <% _.each(files, function(file, index) { %>
        <td class="file"><a href="#"><%= file %></a></td>
        <% if ((index % 2 == 1) && (index != (files.length - 1))) { %>
          </tr>
          <tr>
        <% } %>
      <% })%>
      </tr>
    </table>
  """

  oneColumnTemplate = """
    <table class="sample-files">
      <% _.each(files, function(file, index) { %>
        <tr>
          <td class="file"><a href="#"><%= file %></a></td>
        </tr>
      <% })%>
    </table>
  """

  class StubbedAssetPickerView extends DefaultAssetPickerView

    events: _.extend({}, DefaultAssetPickerView::events,
      'click .sample-files a': 'onChooseSampleImage'
    )

    onChooseSampleImage: (e) ->
      assetsJson = JSON.parse assetsJsonString
      json = assetsJson[@type]

      assets = new vs.api.Assets json, parse: true

      title = $(e.currentTarget).text()
      asset = assets.findWhere title: title

      original = asset.representations.findWhere original: true
      contentType = original.get 'contentType'
      asset.set contentType: contentType

      @showStatus 'Processing complete'
      @onUploadSuccess asset
      @onUseClick()

    onChooseClick: (e) ->
      @noop(e)

    onModalClick: (e) ->

    sampleFileNames: ->
      image: [
        "landscape.jpg"
        "portrait.jpg"
        "short-and-wide.jpg"
        "tall-and-skinny.jpg"
        "small-landscape.jpg"
        "small-portrait.jpg"
        "small-square.jpg"
        "large-square.jpg"
      ]
      video: [
        "small-video.mp4"
        "medium-video.mp4"
        "large-video.mp4"
      ]

    sampleFiles: (fileType) ->
      _.map @sampleFileNames()[fileType], (name) ->
        name.split('.')[0].replace /\-/g, ' '

    sampleFilesTemplate: (type, data) ->
      template = if type == 'image'
        twoColumnTemplate
      else
        oneColumnTemplate
      _.template(template) data

    onRender: ->
      # Hide stuff we don't want to see in when stubbed
      @$el.find('.drop-blurb').text "choose a sample file"
      @$el.find('.drop-image').hide()

      # Show sample files
      files = @sampleFiles @type
      filesMarkup = @sampleFilesTemplate @type, files: files

      @$el.find('.choose-overlay').prepend filesMarkup
      @$el.find('.sample-files').css
        position: 'absolute'
        left: 0
        top: 0
        zIndex: 2
        width: 478
        height: 170
        marginTop: 10

      super
