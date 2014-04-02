var Scene = {
  onAttributesChanged: function(attrs){
    Object.keys(attrs).forEach(function(key){
      this[key] = attrs[key];
    }.bind(this));

    if(this.ready) { this.render(); }
  },

  render: function() {
    var module = document.querySelector('.module');
    module.style['-webkit-animation-duration'] = this.duration + 'ms';
    module.offsetWidth; // trigger reflow

    document.querySelector('.message').textContent = this.message;
    this.ready = true;
  }
};

// Create property sheets
var propertySheets = {
  event: 'setPropertySheetAttributes',
  data: {
    duration: { type: 'Range', min: 500, max: 3000, step: 250 },
    message: { type: 'Text' }
  }
};
window.parent.postMessage(propertySheets, window.location.origin);
window.parent.postMessage({ event: 'setHeight', data: { pixels: 1148 } }, window.location.origin);

window.addEventListener('message', function(e){
  var message = e.data;
  console.log(message.event, message.data);

  switch(message.event) {
    case 'attributesChanged':
      Scene.onAttributesChanged(message.data);
      break;

    case 'attached':
      Scene.render();
      break;
  }
});
