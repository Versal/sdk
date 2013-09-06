(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['text!./template.html'], function(template) {
    var Column;
    return Column = (function() {

      Column.prototype.className = 'column-gadget';

      function Column(facade, properties, $el) {
        this.facade = facade;
        this.properties = properties;
        this.$el = $el;
        this.highlightChildren = __bind(this.highlightChildren, this);

        this.addFacade = __bind(this.addFacade, this);

        this.chooseChild = __bind(this.chooseChild, this);

        this.facade.on('toggleEdit', this.onToggleEdit, this);
        this.facade.on('configChange', this.onConfigChange, this);
        this.facade.on('domReady', this.render, this);
        this.debouncedSave = _.debounce(this.save, 1000);
        this.childFacades = [];
      }

      Column.prototype.onToggleEdit = function(editable) {};

      Column.prototype.onConfigChange = function(properties) {
        this.properties = properties;
      };

      Column.prototype.render = function() {
        this.$el.html(template);
        this.facade.trigger('gadget:showChild', {
          el: this.$el.find('.first .payload'),
          name: 'first',
          success: this.addFacade
        });
        this.facade.trigger('gadget:showChild', {
          el: this.$el.find('.second .payload'),
          name: 'second',
          success: this.addFacade
        });
        this.$el.find('.chooseChild').on('click', this.chooseChild);
        return this.$el.find('.highlightChildren').on('click', this.highlightChildren);
      };

      Column.prototype.chooseChild = function(e) {
        var column, payload, target;
        target = $(e.currentTarget);
        column = target.parent().data('col');
        payload = target.siblings('.payload');
        return this.facade.trigger('gadget:pickChild', {
          el: payload,
          name: column,
          success: this.addFacade
        });
      };

      Column.prototype.addFacade = function(f) {
        var _this = this;
        if (_.contains(this.childFacades, f)) {
          return;
        }
        this.childFacades.push(f);
        return f.on('local:highlightParent', function() {
          _this.$el.css({
            background: 'lightblue'
          });
          return setTimeout(function() {
            return _this.$el.css({
              background: 'whitesmoke'
            });
          }, 500);
        });
      };

      Column.prototype.highlightChildren = function() {
        return _.each(this.childFacades, function(f) {
          return f.trigger('highlightSelf');
        });
      };

      Column.prototype.save = function() {
        return this.facade.trigger('save', this.properties);
      };

      return Column;

    })();
  });

}).call(this);
