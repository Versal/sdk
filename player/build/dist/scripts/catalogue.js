(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['collections/gadget_catalogue', 'plugins/backbone.prioritize'], function(GadgetCatalogue) {
    var CombinedCatalogue;
    CombinedCatalogue = (function(_super) {

      __extends(CombinedCatalogue, _super);

      function CombinedCatalogue() {
        return CombinedCatalogue.__super__.constructor.apply(this, arguments);
      }

      CombinedCatalogue.prototype.fetchAll = function(opts) {
        var approved, sandbox,
          _this = this;
        if (opts == null) {
          opts = {};
        }
        approved = new GadgetCatalogue;
        sandbox = new GadgetCatalogue;
        return $.when(approved.fetchApproved(), sandbox.fetchSandbox()).then(function() {
          var addAs;
          approved.prioritize([
            {
              title: 'Header'
            }, {
              title: 'Text'
            }, {
              title: 'Image',
              type: '6/image@0.7.3'
            }, {
              title: 'Video'
            }, {
              title: 'Quiz'
            }, {
              title: 'Survey'
            }, {
              title: 'Expression'
            }, {
              title: 'Data viewer'
            }, {
              title: 'References'
            }, {
              title: 'Map'
            }, {
              title: 'Markdown'
            }, {
              title: 'Image annotator'
            }, {
              title: 'Image detail'
            }, {
              title: 'Color bar'
            }, {
              title: 'R0'
            }, {
              title: '3D anatomy'
            }, {
              title: 'Cellular automaton'
            }, {
              title: 'Principle of superposition'
            }
          ]);
          addAs = function(catalog, collection) {
            return _this.add(collection.models.map(function(m) {
              if (!m.get('catalog')) {
                m.set({
                  catalog: catalog
                });
              }
              return m;
            }));
          };
          addAs('approved', approved);
          addAs('sandbox', sandbox);
          _this.trigger('reset');
          return _this.trigger('sync');
        });
      };

      return CombinedCatalogue;

    })(GadgetCatalogue);
    return new CombinedCatalogue;
  });

}).call(this);
