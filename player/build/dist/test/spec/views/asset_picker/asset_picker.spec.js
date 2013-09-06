(function() {

  require(['views/asset_picker/asset_picker'], function(AssetPicker) {
    return describe('Asset Picker', function() {
      beforeEach(function() {
        this.view = new AssetPicker({
          type: 'video',
          result: this.callback
        });
        return this.view.render();
      });
      describe('When choosing a file', function() {
        it('should indicate if said file is invalid', function() {
          var fakeFile;
          fakeFile = {
            type: 'audio/mp3',
            name: 'cats_singing.mp3'
          };
          this.view.onChooseComplete(fakeFile);
          return this.view.$('.status-message').text().should.contain("Unsupported file");
        });
        return describe('and the file is valid', function() {
          beforeEach(function() {
            return this.assetSaveStub = sinon.stub(vs.api.Asset.prototype, 'save');
          });
          afterEach(function() {
            return this.assetSaveStub.restore();
          });
          it('should save the file', function() {
            var fakeFile;
            fakeFile = {
              type: 'video/mp4',
              name: 'goat_remix.mp4'
            };
            return this.view.onChooseComplete(fakeFile);
          });
          it('should persist a content type if provided', function() {
            var fakeFile;
            fakeFile = {
              type: 'video/mp4',
              name: 'goat_remix.mp4'
            };
            this.view.onChooseComplete(fakeFile);
            this.assetSaveStub.called.should.eq(true);
            return this.assetSaveStub.firstCall.args[0].contentType.should.eq('video/mp4');
          });
          return it('should use the x-prefix if a type isnt provided', function() {
            var fakeFile;
            fakeFile = {
              name: 'it_is_a_mystery.ogg'
            };
            this.view.onChooseComplete(fakeFile);
            this.assetSaveStub.called.should.eq(true);
            return this.assetSaveStub.firstCall.args[0].contentType.should.eq('video/x-ogg');
          });
        });
      });
      describe('when uploading a file', function() {
        return describe('after upload completes', function() {
          it('should fetch the asset to check availability', function() {
            var asset, assetFetchStub;
            assetFetchStub = sinon.stub(vs.api.Asset.prototype, 'fetch');
            asset = new vs.api.Asset({
              contentType: 'video/webm'
            });
            this.view.onUploadSuccess(asset);
            assetFetchStub.called.should.eq(true);
            return assetFetchStub.restore();
          });
          return it('should continue to fetch if the asset is not available', function() {
            var asset, assetFetchStub, clock, _base;
            assetFetchStub = sinon.stub(vs.api.Asset.prototype, 'fetch');
            clock = sinon.useFakeTimers();
            asset = new vs.api.Asset({
              contentType: 'video/webm'
            });
            asset.representations = new Backbone.Collection([
              {
                type: 'video/mp4',
                name: 'cat_climbing_tree.mp4',
                available: false
              }
            ]);
            this.view.onUploadSuccess(asset);
            assetFetchStub.callCount.should.eq(1);
            if (typeof (_base = assetFetchStub.firstCall.args[0]).success === "function") {
              _base.success(asset);
            }
            clock.tick(3001);
            assetFetchStub.callCount.should.eq(2);
            clock.restore();
            return assetFetchStub.restore();
          });
        });
      });
      return describe('when adding a video link', function() {
        it('should accept various formats of youtube links', function() {
          var urls,
            _this = this;
          urls = ["http://www.youtube.com/watch?v=1kqFwVuQ-Hg", "https://www.youtube.com/watch?v=1kqFwVuQ-Hg", "youtube.com/watch?v=1kqFwVuQ-Hg", "http://youtube.com/watch?v=1kqFwVuQ-Hg", "youtube.com/watch?v=1kqFwVuQ-Hg?t=10s", "http://youtu.be/1kqFwVuQ-Hg", "http://youtu.be/1kqFwVuQ-Hg", "http://www.youtube.com/watch?feature=player_detailpage&v=1kqFwVuQ-Hg"];
          return _.each(urls, function(url) {
            return _this.view.getYoutubeId(url).should.eq("1kqFwVuQ-Hg");
          });
        });
        return it('should accept various formats of vimeo links', function() {
          var urls,
            _this = this;
          urls = ['https://vimeo.com/61248884', 'vimeo.com/61248884', 'http://vimeo.com/61248884'];
          return _.each(urls, function(url) {
            return _this.view.getVimeoId(url).should.eq("61248884");
          });
        });
      });
    });
  });

}).call(this);
