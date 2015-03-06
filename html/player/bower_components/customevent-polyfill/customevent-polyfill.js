(function () {
    'use strict';
    function CustomEvent (event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt;
        try {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        } catch (error) {
            // fallback for browsers that don't support createEvent('CustomEvent')
            evt = document.createEvent('Event');
            for (var param in params) {
                evt[param] = params[param];
            }
            evt.initEvent(event, params.bubbles, params.cancelable);
        }
        return evt;
    }

    if(typeof window.CustomEvent !== 'undefined') {
        CustomEvent.prototype = window.CustomEvent.prototype;
    }

    window.CustomEvent = CustomEvent;
})();