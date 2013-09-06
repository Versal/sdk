require [
  'views/asset_picker/asset_picker'
], (AssetPicker) ->

  describe 'Asset Picker', ->

    beforeEach ->
      @view = new AssetPicker type: 'video', result: @callback
      @view.render()

    describe 'When choosing a file', ->

      it 'should indicate if said file is invalid', ->
        fakeFile =
          type: 'audio/mp3'
          name: 'cats_singing.mp3'

        @view.onChooseComplete fakeFile
        @view.$('.status-message').text().should.contain "Unsupported file"

      describe 'and the file is valid', ->
        beforeEach ->
          @assetSaveStub = sinon.stub vs.api.Asset::, 'save'

        afterEach ->
          @assetSaveStub.restore()

        it 'should save the file', ->
          fakeFile =
            type: 'video/mp4'
            name: 'goat_remix.mp4'

          @view.onChooseComplete fakeFile

        it 'should persist a content type if provided', ->
          fakeFile =
            type: 'video/mp4'
            name: 'goat_remix.mp4'

          @view.onChooseComplete fakeFile
          @assetSaveStub.called.should.eq true
          @assetSaveStub.firstCall.args[0].contentType.should.eq 'video/mp4'

        it 'should use the x-prefix if a type isnt provided', ->
          fakeFile =
            name: 'it_is_a_mystery.ogg'

          @view.onChooseComplete fakeFile
          @assetSaveStub.called.should.eq true
          @assetSaveStub.firstCall.args[0].contentType.should.eq 'video/x-ogg'

    describe 'when uploading a file', ->
      describe 'after upload completes', ->
        it 'should fetch the asset to check availability', ->
          assetFetchStub = sinon.stub vs.api.Asset::, 'fetch'
          asset = new vs.api.Asset {contentType:'video/webm'}
          @view.onUploadSuccess asset
          assetFetchStub.called.should.eq true
          assetFetchStub.restore()

        it 'should continue to fetch if the asset is not available', ->
          assetFetchStub = sinon.stub vs.api.Asset::, 'fetch'
          clock = sinon.useFakeTimers()

          asset = new vs.api.Asset {contentType:'video/webm'}
          asset.representations = new Backbone.Collection [
            {
              type: 'video/mp4',
              name: 'cat_climbing_tree.mp4',
              available: false
            }
          ]
          @view.onUploadSuccess asset
          assetFetchStub.callCount.should.eq 1
          assetFetchStub.firstCall.args[0].success? asset
          clock.tick 3001
          assetFetchStub.callCount.should.eq 2

          clock.restore()
          assetFetchStub.restore()

    describe 'when adding a video link', ->
      it 'should accept various formats of youtube links', ->
        urls = [
          "http://www.youtube.com/watch?v=1kqFwVuQ-Hg"
          "https://www.youtube.com/watch?v=1kqFwVuQ-Hg"
          "youtube.com/watch?v=1kqFwVuQ-Hg"
          "http://youtube.com/watch?v=1kqFwVuQ-Hg"
          "youtube.com/watch?v=1kqFwVuQ-Hg?t=10s"
          "http://youtu.be/1kqFwVuQ-Hg"
          "http://youtu.be/1kqFwVuQ-Hg"
          "http://www.youtube.com/watch?feature=player_detailpage&v=1kqFwVuQ-Hg"
        ]
        _.each urls, (url) =>
          @view.getYoutubeId(url).should.eq "1kqFwVuQ-Hg"

      it 'should accept various formats of vimeo links', ->
        urls = [
          'https://vimeo.com/61248884'
          'vimeo.com/61248884'
          'http://vimeo.com/61248884'
        ]
        _.each urls, (url) =>
          @view.getVimeoId(url).should.eq "61248884"



