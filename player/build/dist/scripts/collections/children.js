(function() {

  define(['cdn.backbone', 'cdn.underscore', 'models/child'], function(Backbone, _, Child) {
    var Children;
    return Children = (function() {

      function Children(models, _arg) {
        if (models == null) {
          models = [];
        }
        this.parent = _arg.parent, this.lesson = _arg.lesson;
        this._children = models;
      }

      Children.prototype.build = function(typeName, success, error) {
        var gadget, type,
          _this = this;
        type = (function() {
          switch (typeName) {
            case "image":
              return "versal/image@0.7.3";
            case "video":
              return "versal/video@0.1.1";
            case "markdown":
              return "versal/markdown@0.0.3";
          }
        })();
        gadget = this.lesson.insertGadgetTypeAt(type, this.lesson.children.length);
        return gadget.once('sync', function() {
          gadget.config.save({
            _hidden: true
          });
          _this._children.push(gadget.id);
          _this.parent.model.config.save({
            _children: _this._children
          });
          return success(gadget.id);
        });
      };

      Children.prototype.renderById = function(id, $el) {
        var model, view;
        console.log("Render by ID", id);
        console.log("Children thus far: ", this._children);
        if (!_.contains(this._children, id)) {
          return;
        }
        model = this.lesson.collection.get(id);
        view = this.lesson.children.findByModel(model);
        view.setElement($el);
        return view.render();
      };

      Children.prototype.toggleEdit = function(bool) {};

      Children.prototype._children = [];

      return Children;

    })();
  });

}).call(this);
