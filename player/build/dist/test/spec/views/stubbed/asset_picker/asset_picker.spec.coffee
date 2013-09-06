require [
  '../scripts/views/stubbed/asset_picker/asset_picker'
], (StubbedAssetPicker) ->

  describe 'Stubbed Asset Picker', ->

    beforeEach ->
      @view = new StubbedAssetPicker type: 'video', result: @callback
      @view.render()

    describe 'When choosing a file', ->

      it 'should show stubbed drop blurb', ->
        @view.$('.drop-blurb').text().should.contain "choose a sample file"

      it 'should hide the drop image', ->
        @view.$('.drop-image').is(":visible").should.be.false

      describe 'and the file is an image', ->
        beforeEach ->
          @view = new StubbedAssetPicker type: 'image', result: @callback
          @view.render()

        it 'should show a list of 8 sample images', ->
          @view.$('.sample-files .file').length.should.eql 8

          # Check the labels
          _.each [
            'landscape'
            'portrait'
            'short and wide'
            'tall and skinny'
            'small landscape'
            'small portrait'
            'small square'
            'large square'
          ], (label, index) =>
            el = @view.$('.sample-files .file').get(index)
            $(el).text().should.contain label


      describe 'and the file is an video', ->
        it 'should show a list of 3 sample videos', ->
          @view.$('.sample-files .file').length.should.eql 3

          # Check the labels
          _.each [
            'small video'
            'medium video'
            'large video'
          ], (label, index) =>
            el = @view.$('.sample-files .file').get(index)
            $(el).text().should.contain label

      describe 'and a sample link is clicked', ->

        beforeEach ->
          @syncStub = sinon.stub vs.api.Asset::, 'sync'

        it 'should result in a successful upload in the player', ->
          spy = sinon.spy()
          @view = new StubbedAssetPicker type: 'video', result: spy
          @view.render()
          @view.$el.find('a').first().click()
          sampleAsset = spy.args[0][0]
          sampleAsset.get('title').should.eq "small video"
