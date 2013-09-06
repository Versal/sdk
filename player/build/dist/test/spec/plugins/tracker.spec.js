(function() {

  define(['cdn.jquery', 'plugins/tracker'], function($, trackerMixin) {
    var TrackedClass;
    TrackedClass = (function() {

      function TrackedClass() {}

      _.extend(TrackedClass.prototype, trackerMixin('just-a-class'));

      return TrackedClass;

    })();
    return describe('A class with a mixed-in tracker', function() {
      beforeEach(function() {
        this.clock = sinon.useFakeTimers();
        this.clock.tick(20001);
        this.tracked = new TrackedClass;
        return this.ajaxStub = sinon.stub($, 'ajax');
      });
      afterEach(function() {
        this.ajaxStub.restore();
        return this.clock.restore();
      });
      it('should have some tracking helpers', function() {
        this.tracked.track.should.be.defined;
        this.tracked.startTimer.should.be.defined;
        return this.tracked.endTimer.should.be.defined;
      });
      it('should send events to Versal roughly every 20 seconds', function() {
        var data, options;
        this.tracked.track('Something happened', {
          foo: 'bar'
        });
        this.clock.tick(20001);
        this.ajaxStub.callCount.should.eq(1);
        options = this.ajaxStub.firstCall.args[0];
        data = JSON.parse(options.data);
        return data.length.should.eq(1);
      });
      it('should batch up multiple events', function() {
        var data, options;
        this.tracked.track('What is this', {
          foo: 'bar'
        });
        this.tracked.track('I dont even know', {
          baz: 'bang'
        });
        this.tracked.track('Something Else Happened', {
          interjection: 'or did it?'
        });
        this.clock.tick(20001);
        this.ajaxStub.callCount.should.eq(1);
        options = this.ajaxStub.firstCall.args[0];
        data = JSON.parse(options.data);
        return data.length.should.eq(3);
      });
      return it('should support named timers', function() {
        var data, options;
        this.tracked.startTimer('some-cool-timer');
        this.clock.tick(1337);
        this.tracked.endTimer('some-cool-timer');
        this.clock.tick(40001);
        this.ajaxStub.callCount.should.eq(1);
        options = this.ajaxStub.firstCall.args[0];
        data = JSON.parse(options.data);
        data.length.should.eq(1);
        data[0].eventType.should.eq('timer');
        return data[0].data.length.should.eq(1337);
      });
    });
  });

}).call(this);
