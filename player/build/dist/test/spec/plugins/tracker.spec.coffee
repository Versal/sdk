define [
  'cdn.jquery'
  'plugins/tracker'
], ($, trackerMixin) ->

  class TrackedClass
    _.extend @::, trackerMixin('just-a-class')

  describe 'A class with a mixed-in tracker', ->

    beforeEach ->
      @clock = sinon.useFakeTimers()
      @clock.tick 20001 # Clear any events in the queue
      @tracked = new TrackedClass
      @ajaxStub = sinon.stub $, 'ajax'

    afterEach ->
      @ajaxStub.restore()
      @clock.restore()

    it 'should have some tracking helpers', ->
      @tracked.track.should.be.defined
      @tracked.startTimer.should.be.defined
      @tracked.endTimer.should.be.defined

    it 'should send events to Versal roughly every 20 seconds', ->
      @tracked.track 'Something happened', { foo: 'bar' }
      @clock.tick 20001

      @ajaxStub.callCount.should.eq 1
      options = @ajaxStub.firstCall.args[0]
      data = JSON.parse options.data
      data.length.should.eq 1

    it 'should batch up multiple events', ->
      @tracked.track 'What is this', { foo: 'bar' }
      @tracked.track 'I dont even know', { baz: 'bang' }
      @tracked.track 'Something Else Happened', { interjection: 'or did it?' }
      @clock.tick 20001

      @ajaxStub.callCount.should.eq 1
      options = @ajaxStub.firstCall.args[0]
      data = JSON.parse options.data
      data.length.should.eq 3

    it 'should support named timers', ->
      @tracked.startTimer 'some-cool-timer'
      @clock.tick 1337
      @tracked.endTimer 'some-cool-timer'
      @clock.tick 40001

      @ajaxStub.callCount.should.eq 1
      options = @ajaxStub.firstCall.args[0]
      data = JSON.parse options.data
      data.length.should.eq 1
      data[0].eventType.should.eq 'timer'
      data[0].data.length.should.eq 1337
