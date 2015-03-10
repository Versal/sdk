var ReactLauncher = Object.create(HTMLElement.prototype)

ReactLauncher.createdCallback = function() {
  this.innerHTML = 'react'
};

ReactLauncher.attachedCallback = function() {
  console.log(window.React);
};

ReactLauncher.detachedCallback = function() {
  console.log('bye')
};

document.registerElement('react-launcher', { prototype: ReactLauncher })
