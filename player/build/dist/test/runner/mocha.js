require([
  'cdn.lodash',
  'cdn.jquery',
  'cdn.backbone',
  'plugins/vs.api',
  'spec/player.spec',
  'spec/collections/gadget_catalogue.spec',
  'spec/messages/channel.spec',
  'spec/messages/facade.spec',
  'spec/messages/mediator.spec',
  'spec/messages/handlers/asset_select.spec',
  'spec/messages/handlers/style_register.spec',
  'spec/plugins/tracker.spec',
  'spec/views/asset_picker/asset_picker.spec',
  'spec/views/stubbed/asset_picker/asset_picker.spec',
  'spec/views/course.spec',
  'spec/views/sidebar/author/author.spec',
  'spec/views/sidebar/author/catalogue.spec',
  'spec/views/sidebar/author/gadget.spec',
  'spec/views/overview/course_thumbnail.spec',
  'spec/views/overview/courses.spec',
  'spec/views/gadget_instance.spec',
  'spec/views/sidebar/learner.spec',
  'spec/views/lesson.spec',
  'spec/views/nav_buttons.spec',
], function() {
  var runner = mocha.run();
});
