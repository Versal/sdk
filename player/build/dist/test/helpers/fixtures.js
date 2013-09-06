(function() {

  define(['cdn.lodash'], function(_) {
    var Fixtures, factory;
    factory = function(fixture) {
      var defaults;
      defaults = _.isFunction(fixture) ? fixture() : fixture;
      return function(klass, attrs) {
        if (_.isFunction(klass)) {
          return new klass(_.extend({}, defaults, attrs));
        } else if (_.isObject(klass)) {
          return _.extend({}, defaults, klass);
        } else {
          return defaults;
        }
      };
    };
    Fixtures = {};
    Fixtures.Course = factory(function() {
      return {
        title: 'my course',
        lessons: [
          {
            isAccessible: true,
            title: 'lesson 1',
            gadgets: []
          }, {
            isAccessible: true,
            title: 'lesson 2',
            gadgets: []
          }, {
            isAccessible: true,
            title: 'lesson 3',
            gadgets: []
          }
        ]
      };
    });
    Fixtures.Lesson = factory(function() {
      return {
        title: 'my lesson',
        gadgets: [
          {
            id: '32001',
            type: 'text'
          }, {
            id: '32002',
            type: 'text'
          }, {
            id: '32003',
            type: 'text'
          }, {
            id: '32004',
            type: 'text'
          }
        ]
      };
    });
    Fixtures.Gadgets = factory(function() {
      return [
        {
          title: 'test gadget',
          author: 'Versal Group Inc',
          catalog: 'approved',
          version: '1.10.1',
          icon: {
            "default": "http://path/to/icon.png"
          }
        }, {
          title: 'dev gadget',
          author: 'Versal Group Inc',
          catalog: 'sandbox',
          version: '0.1.0',
          icon: {
            "default": "http://path/to/icon.png"
          }
        }
      ];
    });
    return Fixtures;
  });

}).call(this);
