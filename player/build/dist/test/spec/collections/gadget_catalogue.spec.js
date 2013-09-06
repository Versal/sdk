(function() {

  require(['helpers/helpers', 'helpers/fixtures', 'collections/gadget_catalogue'], function(Helpers, Fixtures, GadgetCatalogue) {
    return describe('GadgetCatalogue', function() {
      beforeEach(function() {
        return this.collection = new GadgetCatalogue;
      });
      describe('initializing', function() {
        return it('should not be ready', function() {
          return this.collection.isReady().should.be["false"];
        });
      });
      return describe('When sync\'d with the server', function() {
        beforeEach(function() {
          this.ready = sinon.spy();
          return this.collection.on('ready', this.ready);
        });
        describe('When it wasn\'t ready', function() {
          it('should become ready', function() {
            this.collection.trigger('sync', this.collection);
            return this.collection.isReady().should.be["true"];
          });
          return it('should fire a ready event', function() {
            this.collection.trigger('sync', this.collection);
            return this.ready.calledOnce.should.be["true"];
          });
        });
        return describe('When it was already ready', function() {
          beforeEach(function() {
            return this.collection._isReady = true;
          });
          return it('should do nothing', function() {
            this.collection.trigger('sync', this.collection);
            return this.ready.called.should.be["false"];
          });
        });
      });
    });
  });

}).call(this);
