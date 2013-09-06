(function() {

  define(['messages/handlers/asset_select'], function(assetSelectHandler) {
    return describe('assetSelectHandler', function() {
      return it('is', function() {
        return assetSelectHandler.should.be.defined;
      });
    });
  });

}).call(this);
