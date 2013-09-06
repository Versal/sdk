(function() {

  require(['../scripts/views/stubbed/asset_picker/asset_picker'], function(StubbedAssetPicker) {
    return describe('Stubbed Asset Picker', function() {
      beforeEach(function() {
        this.view = new StubbedAssetPicker({
          type: 'video',
          result: this.callback
        });
        return this.view.render();
      });
      return describe('When choosing a file', function() {
        it('should show stubbed drop blurb', function() {
          return this.view.$('.drop-blurb').text().should.contain("choose a sample file");
        });
        it('should hide the drop image', function() {
          return this.view.$('.drop-image').is(":visible").should.be["false"];
        });
        describe('and the file is an image', function() {
          beforeEach(function() {
            this.view = new StubbedAssetPicker({
              type: 'image',
              result: this.callback
            });
            return this.view.render();
          });
          return it('should show a list of 8 sample images', function() {
            var _this = this;
            this.view.$('.sample-files .file').length.should.eql(8);
            return _.each(['landscape', 'portrait', 'short and wide', 'tall and skinny', 'small landscape', 'small portrait', 'small square', 'large square'], function(label, index) {
              var el;
              el = _this.view.$('.sample-files .file').get(index);
              return $(el).text().should.contain(label);
            });
          });
        });
        describe('and the file is an video', function() {
          return it('should show a list of 3 sample videos', function() {
            var _this = this;
            this.view.$('.sample-files .file').length.should.eql(3);
            return _.each(['small video', 'medium video', 'large video'], function(label, index) {
              var el;
              el = _this.view.$('.sample-files .file').get(index);
              return $(el).text().should.contain(label);
            });
          });
        });
        return describe('and a sample link is clicked', function() {
          beforeEach(function() {
            return this.syncStub = sinon.stub(vs.api.Asset.prototype, 'sync');
          });
          return it('should result in a successful upload in the player', function() {
            var sampleAsset, spy;
            spy = sinon.spy();
            this.view = new StubbedAssetPicker({
              type: 'video',
              result: spy
            });
            this.view.render();
            this.view.$el.find('a').first().click();
            sampleAsset = spy.args[0][0];
            return sampleAsset.get('title').should.eq("small video");
          });
        });
      });
    });
  });

}).call(this);
