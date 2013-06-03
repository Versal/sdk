define('gadget', ['cdn.backbone', 'cdn.jquery'], function(jquery, Backbone){
  //jquery and backbone are used inside the gadget
  return function(){}; // return constructor
})

define('gadget-dependency', ['cdn.backbone'], function(Backbone){
  //dependency for gadget
  return {};
})