(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['collections/gadget_catalogue', 'gadgets/section/gadget', 'gadgets/column/gadget', 'gadgets/lipsum/gadget', 'plugins/backbone.prioritize'], function(GadgetCatalogue, SectionGadget, ColumnGadget, LipsumGadget) {
    var CombinedCatalogue, localSection;
    localSection = new vs.api.GadgetProject({
      author: "Versal",
      catalog: "approved",
      icon: "//s3-us-west-2.amazonaws.com/net.vrsl.stack.prod.static/player2/assets/img/authorSidebar/icon_header_gadget.png",
      classDefinition: SectionGadget,
      id: "section",
      title: "Header",
      username: "versal",
      name: "header",
      version: "0.2.9",
      noToggleSwitch: true,
      noCss: true
    });
    CombinedCatalogue = (function(_super) {

      __extends(CombinedCatalogue, _super);

      function CombinedCatalogue() {
        return CombinedCatalogue.__super__.constructor.apply(this, arguments);
      }

      CombinedCatalogue.prototype.fetchAll = function(opts) {
        var approved, unapproved,
          _this = this;
        if (opts == null) {
          opts = {};
        }
        approved = new GadgetCatalogue;
        unapproved = new GadgetCatalogue;
        return $.when(approved.fetchApproved(), unapproved.fetchUnapproved()).then(function() {
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
          _this.add(approved.models);
          _this.add(unapproved.models);
          if (!_this.find(function(g) {
            return g.type() === 'versal/header@0.2.9';
          })) {
            _this.add(localSection);
          }
          _this.trigger('reset');
          return _this.trigger('sync');
        });
      };

      return CombinedCatalogue;

    })(GadgetCatalogue);
    return new CombinedCatalogue;
  });

}).call(this);
