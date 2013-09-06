(function() {

  define(['css-parse', 'css-stringify'], function(parse, stringify) {
    var handler, registered,
      _this = this;
    registered = {};
    handler = function(message, options) {
      var files, href, key, xhr;
      if (!(href = message.href)) {
        return;
      }
      key = message.key;
      files = message.files;
      if (registered[href]) {
        return;
      }
      registered[href] = true;
      xhr = $.get(href, {
        dataType: 'text'
      });
      xhr.done(_.wrap(handler.addStyle, function(func, data) {
        return func(data, key, files);
      }));
      return xhr.fail(function() {
        return registered[href] = false;
      });
    };
    handler.namespaceSelector = function(key, selector) {
      return key + ' ' + selector;
    };
    handler.namespaceRules = function(key, rules) {
      var rule, s, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = rules.length; _i < _len; _i++) {
        rule = rules[_i];
        if (rule.selectors != null) {
          _results.push(rule.selectors = (function() {
            var _j, _len1, _ref, _results1;
            _ref = rule.selectors;
            _results1 = [];
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              s = _ref[_j];
              _results1.push(handler.namespaceSelector(key, s));
            }
            return _results1;
          })());
        } else if (rule.rules != null) {
          _results.push(handler.namespaceRules(key, rule.rules));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    handler.namespaceCss = function(key, data) {
      var ast;
      ast = parse(data);
      handler.namespaceRules(key, ast.stylesheet.rules);
      return stringify(ast, {
        compress: true
      });
    };
    handler.rewriteAssetUrls = function(css, files) {
      _.each(files, function(cdnFile, localFile) {
        var localFileRE;
        localFileRE = new RegExp(localFile, "g");
        return css = css.replace(localFileRE, cdnFile);
      });
      return css;
    };
    handler.addStyle = function(data, key, files) {
      var $style, cssClass;
      cssClass = "style-" + key;
      $style = $("style." + cssClass);
      if ($style.length < 1) {
        $style = $('<style />').addClass(cssClass);
      }
      data = handler.rewriteAssetUrls(data, files);
      $style.text(handler.namespaceCss("." + key, data));
      return $style.appendTo('body');
    };
    return handler;
  });

}).call(this);
