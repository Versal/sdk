describe('iframe launcher', function() {
  var launcher;

  beforeEach(function() {
    launcher = document.createElement('versal-iframe-launcher');
    launcher.setAttribute('data-environment', '{"test": "initial-environment"}');
    launcher.setAttribute('data-config', '{"test": "initial-config"}');
    launcher.setAttribute('data-userstate', '{"test": "initial-userstate"}');
    launcher.setAttribute('src', '/base/iframe-launcher/test/test_gadget.html');
    document.body.appendChild(launcher);
  });

  afterEach(function() {
    document.body.removeChild(launcher);
  });

  it("doesn't send events before starting to listen", function(done) {
    window.gadgetLoaded = function() {
      launcher.setAttribute('data-config', '{"test": "something"}');
      window.recordPlayerEvent = function(eventMessage) {
        done("No events should be fired");
      };
      setTimeout(done, 100);
    }
  });

  describe('player events', function() {
    before(function() {
      window.gadgetLoaded = function() {
        launcher.children[0].contentWindow.sendGadgetEvent({event: 'startListening'});
      }
    });

    it('sends a bunch of initial events', function(done) {
      var recordedEvents = [];

      window.recordPlayerEvent = function(eventMessage) {
        recordedEvents.push(eventMessage);

        if (eventMessage.event == 'editableChanged') {
          chai.expect(recordedEvents).to.deep.equal([
            {event: 'environmentChanged', data: {test: 'initial-environment'}},
            {event: 'attributesChanged', data: {test: 'initial-config'}},
            {event: 'learnerStateChanged', data: {test: 'initial-userstate'}},
            {event: 'editableChanged', data: {editable: false}},
          ]);
          delete window.recordPlayerEvent;
          done();
        }
      };
    });

    it('sends attributesChanged when data-config changes', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          launcher.setAttribute('data-config', '{"test": "new-config"}');
        }
        if (eventMessage.event == 'attributesChanged' &&
              eventMessage.data.test == 'new-config') {
          done();
        }
      };
    });

    it('doesnt send attributesChanged when data-config doesnt really change', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          window.recordPlayerEvent = function(eventMessage) {
            if (eventMessage.event == 'attributesChanged') done("attributesChanged should not be called");
          }
          launcher.setAttribute('data-config', '{"test"   :    "initial-config"}');
        }
      };
      setTimeout(done, 100);
    });

    it('sends learnerStateChanged when data-userstate changes', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          launcher.setAttribute('data-userstate', '{"test": "new-userstate"}');
        }
        if (eventMessage.event == 'learnerStateChanged' &&
              eventMessage.data.test == 'new-userstate') {
          done();
        }
      };
    });

    it('doesnt send learnerStateChanged when data-userstate doesnt really change', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          window.recordPlayerEvent = function(eventMessage) {
            if (eventMessage.event == 'learnerStateChanged') done("learnerStateChanged should not be called");
          }
          launcher.setAttribute('data-userstate', '{"test"   :    "initial-userstate"}');
        }
      };
      setTimeout(done, 100);
    });

    it('sends editableChanged when editable changes', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          launcher.setAttribute('editable', true);
        }
        if (eventMessage.event == 'editableChanged' &&
              eventMessage.data.editable === true) {
          done();
        }
      };
    });
  });

  describe('gadget events', function() {

    beforeEach(function(done){
      window.gadgetLoaded = function() {
        launcher.children[0].contentWindow.sendGadgetEvent({event: 'startListening'});
      }
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'editableChanged') {
          done();
        }
      };
    });

    it('patches config when receiving setAttributes', function(done) {
      var observer = new MutationObserver(function() {
        chai.expect(launcher.config).to.deep.eq(
          {test: 'initial-config', test2: 'new-config'});
        observer.disconnect();
        done();
      });
      observer.observe(launcher, {attributes: true});

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setAttributes', data: {test2: 'new-config'}});
    });

    it('sends attributesChanged after receiving setAttributes', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'attributesChanged' &&
              eventMessage.data.test2 == 'new-config') {
          done();
        }
      };

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setAttributes', data: {test2: 'new-config'}});
    });

    it('only sends one attributesChanged after to immediately subsequent setAttributes events', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'attributesChanged' &&
              eventMessage.data.value == 2) {
          done();
        } else {
          done('attributesChanged should only fire with {value: 2}, not: ' + JSON.stringify(eventMessage));
        }
      };

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setAttributes', data: {value: 1}});
      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setAttributes', data: {value: 2}});
    });

    it('patches userstate when receiving setLearnerState', function(done) {
      var observer = new MutationObserver(function() {
        chai.expect(launcher.userstate).to.deep.eq(
          {test: 'initial-userstate', test2: 'new-userstate'});
        observer.disconnect();
        done();
      });
      observer.observe(launcher, {attributes: true});

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setLearnerState', data: {test2: 'new-userstate'}});
    });

    it('sends learnerStateChanged after receiving setLearnerState', function(done) {
      window.recordPlayerEvent = function(eventMessage) {
        if (eventMessage.event == 'learnerStateChanged' &&
              eventMessage.data.test2 == 'new-userstate') {
          done();
        }
      };

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setLearnerState', data: {test2: 'new-userstate'}});
    });

    it('updates height when receiving setHeight', function(done) {
      var observer = new MutationObserver(function() {
        chai.expect(launcher.clientHeight).to.eq(137);
        observer.disconnect();
        done();
      });
      observer.observe(launcher, {attributes: true, subtree: true});

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setHeight', data: {pixels: 137}});
    });

    it('does NOT cap height', function(done) {
      var observer = new MutationObserver(function() {
        chai.expect(launcher.clientHeight).to.eq(10000);
        observer.disconnect();
        done();
      });
      observer.observe(launcher, {attributes: true, subtree: true});

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setHeight', data: {pixels: 10000}});
    });

    it('fires "rendered" the first time it receives setHeight', function(done) {
      var eventCount = 0;
      launcher.addEventListener('rendered', function() {
        eventCount++;
      });

      launcher.addEventListener('track', function() {
        chai.expect(eventCount).to.equal(1);
        done();
      });

      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setHeight', data: {pixels: 1337}});
      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setHeight', data: {pixels: 0}});
      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'setHeight', data: {pixels: 1337}});
      launcher.children[0].contentWindow.sendGadgetEvent(
        {event: 'track'});
    });

    it('passes on some events that are handled by the player', function(done) {
      eventList = ['setPropertySheetAttributes', 'setEmpty', 'track', 'changeBlocking', 'requestAsset'];
      eventsFired = 0;
      eventList.forEach(function(eventName) {
        // count every event being fired, until we've had them all
        launcher.addEventListener(eventName, function() {
          if (++eventsFired == eventList.length) done();
        });
      });

      // send all events
      eventList.forEach(function(eventName) {
        launcher.children[0].contentWindow.sendGadgetEvent({event: eventName});
      });
    });

    it('passes on error events', function(done) {
      previousOnError = window.onerror;
      window.onerror = function() {
        window.onerror = previousOnError;
        done();
      };
      launcher.children[0].contentWindow.sendGadgetEvent({event: 'error'});
    });

    it('allows the fullscreen API', function() {
      // Unfortunately we cannot check the fullscreen API itself, because this test file
      // is run in an iframe itself, which does not have allowfullscreen set... :-(
      chai.expect(launcher.children[0].getAttribute('allowfullscreen')).to.be.ok;
    });
  });
});
