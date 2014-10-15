(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('react'));
  }
  else if (typeof define === 'function' && define.amd) {
    define(['react'], factory);
  }
  else {
    var globalAlias = 'ReactCoffeescriptGlue';
    var namespace = globalAlias.split('.');
    var parent = root;
    for ( var i = 0; i < namespace.length-1; i++ ) {
      if ( parent[namespace[i]] === undefined ) parent[namespace[i]] = {};
      parent = parent[namespace[i]];
    }
    parent[namespace[namespace.length-1]] = factory(root['React']);
  }
}(this, function(React) {
  function _requireDep(name) {
    return {'react': React}[name];
  }

  var _bundleExports = (function() {
  var define_tag, method, tag, _ref,
    __slice = [].slice;

  define_tag = function(tag) {
    if (!({}.hasOwnProperty.call(React.DOM, tag) && tag !== 'injection')) {
      return;
    }
    return window['_' + tag] = function() {
      var attr, attrs, children, key, options, value, _i, _len, _ref, _ref1;
      attrs = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (Array.isArray(attrs)) {
        options = {
          className: ''
        };
        for (_i = 0, _len = attrs.length; _i < _len; _i++) {
          attr = attrs[_i];
          if (typeof attr === 'string') {
            options.className += ' ' + attr;
          } else {
            for (key in attr) {
              value = attr[key];
              options[key] = value;
            }
          }
        }
        return (_ref = React.DOM)[tag].apply(_ref, [options].concat(__slice.call(children)));
      } else {
        return (_ref1 = React.DOM)[tag].apply(_ref1, [attrs].concat(__slice.call(children)));
      }
    };
  };

  _ref = React.DOM;
  for (tag in _ref) {
    method = _ref[tag];
    define_tag(tag);
  }

}).call(this);


  return _bundleExports;
}));
