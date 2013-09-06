(function() {

  define(['messages/handlers/style_register'], function(styleRegisterHandler) {
    describe('styleRegisterHandler', function() {
      var namespace, specs;
      namespace = '.bloop';
      specs = [
        {
          name: 'vanilla CSS',
          source: '.foobar { color: red }',
          expected: new RegExp("" + namespace + " \.foobar")
        }, {
          name: 'vanilla CSS with multiple rules',
          source: '.foobar { color: red } #baz { color: blue }',
          expected: new RegExp("" + namespace + " \.foobar.*" + namespace + " #baz", 'm')
        }, {
          name: 'vanilla CSS with multiple selectors',
          source: '#baz, .foobar { color: red }',
          expected: new RegExp("" + namespace + " #baz\s*,\s*" + namespace + " \.foobar", 'm')
        }, {
          name: 'vanilla CSS with nested selectors',
          source: '#baz .foobar { color: red }',
          expected: new RegExp("" + namespace + " #baz \.foobar")
        }, {
          name: 'media queries',
          source: '@media some-rule { .foobar { color: red } }',
          expected: new RegExp("" + namespace + " \.foobar")
        }, {
          name: 'media queries with added complexity',
          source: '.foo { color: green}\n @media some-rule { .foobar { color: red } }',
          expected: new RegExp("" + namespace + " \.foo.*@media some-rule\\s*{\\s*" + namespace + "\\s*\.foobar")
        }, {
          name: 'works with webkit-min-device-pixel-ratio',
          source: '@media (-webkit-min-device-pixel-ratio:2){.blah{ color: red }} .foobar{ color: green }',
          expected: new RegExp("" + namespace + " \.foobar")
        }, {
          name: 'doesnt crash on empty media rules',
          source: '@media (){}',
          expected: new RegExp("media")
        }, {
          name: 'keyframes',
          source: '@keyframes some-keyframe { 0% { color:red } 10% { color:green } 100% { color:blue } }',
          expected: /color:\s*blue/
        }
      ];
      it('is', function() {
        return styleRegisterHandler.should.be.defined;
      });
      return describe('when scoping styles', function() {
        _.each(specs, function(spec) {
          return it("should scope " + spec.name + " correctly", function() {
            var css;
            css = styleRegisterHandler.namespaceCss(namespace, spec.source);
            return css.should.match(spec.expected);
          });
        });
        return describe('when invalid tokens are encountered', function() {
          return it('should throw an error', function() {
            var invalid;
            invalid = '@import "foobar.css"; .foo { color: red }';
            return (styleRegisterHandler.namespaceCss('ns', invalid)).should["throw"];
          });
        });
      });
    });
    return describe('rewriteAssetUrls', function() {
      it('should rewrite any relative assets/ paths to cdn urls', function() {
        var css, files;
        css = '.foo { background-image: url(assets/path/to/image.jpg) }';
        files = {
          'assets/path/to/image.jpg': 'http://path/to/cdn/image.jpg'
        };
        css = styleRegisterHandler.rewriteAssetUrls(css, files);
        css.should.not.match(new RegExp('assets/path/to/image.jpg'));
        return css.should.match(new RegExp('http://path/to/cdn/image.jpg'));
      });
      return it('should rewrite multiple occurrences of relative assets/ paths to cdn urls', function() {
        var css, files;
        css = '.foo { background-image: url(assets/path/to/image.jpg) } .bar { background-image: url(assets/path/to/image.jpg) }';
        files = {
          'assets/path/to/image.jpg': 'http://path/to/cdn/image.jpg'
        };
        css = styleRegisterHandler.rewriteAssetUrls(css, files);
        css.should.not.match(new RegExp('assets/path/to/image.jpg'));
        return css.should.match(new RegExp('http://path/to/cdn/image.jpg'));
      });
    });
  });

}).call(this);
