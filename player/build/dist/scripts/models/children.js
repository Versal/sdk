(function() {

  define(['cdn.underscore'], function(_) {
    var Children;
    return Children = (function() {

      function Children(models, _arg) {
        if (models == null) {
          models = [];
        }
        this.parent = _arg.parent, this.lesson = _arg.lesson;
        this._children = models;
      }

      Children.prototype.build = function(type, success, error) {
        var gadget,
          _this = this;
        gadget = this.lesson.insertGadgetTypeAt(type, this.lesson.children.length, {
          _hidden: true
        });
        return gadget != null ? gadget.once('sync', function() {
          _this._children.push(gadget.id);
          _this.parent.model.config.save({
            _children: _this._children
          });
          return success(gadget.id);
        }) : void 0;
      };

      Children.prototype.renderById = function(id, $el) {
        var model, view;
        if (!_.contains(this._children, id)) {
          return;
        }
        this._childrenInUse.push(id);
        model = this.lesson.collection.get(id);
        if (!model) {
          return;
        }
        if (!model.config.get('_hidden')) {
          model.config.save({
            _hidden: true
          });
        }
        view = this.lesson.children.findByModel(model);
        $el.empty();
        view.$el.detach().find('.gadgetContent').appendTo($el);
        return view.setElement($el);
      };

      Children.prototype.destroy = function(id) {
        var model;
        if (!_.contains(this._children, id)) {
          return;
        }
        model = this.lesson.collection.get(id);
        if (model != null) {
          model.destroy();
        }
        this._children = _.without(this._children, id);
        return this._childrenInUse = _.without(this._childrenInUse, id);
      };

      Children.prototype.toggleEdit = function(bool) {
        var _this = this;
        return _.each(this._childrenInUse, function(id) {
          var model, view;
          if (model = _this.lesson.collection.get(id)) {
            view = _this.lesson.children.findByModel(model);
            return view.passEvent('toggleEdit', bool);
          }
        });
      };

      Children.prototype._children = [];

      Children.prototype._childrenInUse = [];

      return Children;

    })();
  });

}).call(this);
