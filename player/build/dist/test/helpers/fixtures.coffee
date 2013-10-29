define ['cdn.lodash'], (_) ->

  # `factory` implements test fixtures as object factories. 
  factory = (fixture) ->
    defaults = if _.isFunction(fixture) then fixture() else fixture
    (klass, attrs) ->
      if _.isFunction(klass) # build it
        new klass(_.extend {}, defaults, attrs)
      else if _.isObject(klass) # no klass, just attrs
        _.extend {}, defaults, klass
      else # 
        defaults

  Fixtures = {}

  Fixtures.Course = factory ->
    title: 'my course'
    lessons: [
      {
        isAccessible: true
        title: 'lesson 1'
        gadgets: []
      },
      {
        isAccessible: true
        title: 'lesson 2'
        gadgets: []
      },
      {
        isAccessible: true
        title: 'lesson 3'
        gadgets: []
      }
    ]

  Fixtures.BlockedCourse = factory ->
    title: 'my course'
    lessons: [
      {
        isAccessible: true
        title: 'lesson 1'
        gadgets: []
      },
      {
        isAccessible: true
        title: 'lesson 2'
        gadgets: []
      },
      {
        isAccessible: false
        title: 'lesson 3'
        gadgets: []
      }

    ]

  Fixtures.Lesson = factory ->
    title: 'my lesson'
    gadgets: [
      { id: '32001', type: 'text' }
      { id: '32002', type: 'text' }
      { id: '32003', type: 'text' }
      { id: '32004', type: 'text' }
    ]

  Fixtures.Gadgets = factory ->
    [
      {
        title: 'test gadget',
        author: 'Versal Group Inc'
        catalog: 'approved',
        version: '1.10.1',
        icon:
          default: "http://path/to/icon.png"
      }
      {
        title: 'dev gadget',
        author: 'Versal Group Inc'
        catalog: 'sandbox',
        version: '0.1.0',
        icon:
          default: "http://path/to/icon.png"
      }
    ]

  Fixtures
