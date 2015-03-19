/*

Current state of affairs:

  - Gadget must be exported to window object, modules are not supported
    Proper support for modules will come later.
    Currently player is built with r.js and that breaks modules.

  - The name of the export on window object must equal to the "name" field in versal.json
    Player will look up this name on window object, after script is downloaded and evaluated

*/

window.SampleGadget = React.createClass({

  propTypes: {
    gadget: React.PropTypes.shape({
      // Gadget API:

      //Indicates, whether the gadget is editable or not (author/learner modes)
      isEditable: React.PropTypes.bool.isRequired,
      // It won't do anything, if gadget is not editable.
      patchProps: React.PropTypes.func.isRequired,
      // Environment. Contains `sessionId` of current user and `apiUrl`
      environment: React.PropTypes.object
    }).isRequired,

    // Gadget-specific properties
    counter: React.PropTypes.number
  },

  getDefaultProps: function(){
    return {
      counter: 0
    }
  },

  render: function(){
    if(this.props.gadget.isEditable) {
      return React.DOM.button({ onClick: this.increaseCounter }, this.props.counter)
    } else {
      return React.DOM.div(null, 'Clicks so far:' + this.props.counter)
    }
  },

  increaseCounter: function(){
    this.props.gadget.patchProps({ counter: this.props.counter + 1 })
  }
})
