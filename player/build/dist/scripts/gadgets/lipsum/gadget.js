(function() {

  define(['text!./template.html'], function(template) {
    var Lipsum;
    return Lipsum = (function() {

      Lipsum.prototype.className = 'lipsum-gadget';

      function Lipsum(facade, properties, $el) {
        this.facade = facade;
        this.properties = properties;
        this.$el = $el;
        this.facade.on('domReady', this.render, this);
        this.facade.on('local:highlightSelf', this.highlightSelf, this);
      }

      Lipsum.prototype.render = function() {
        var _this = this;
        this.$el.html(template);
        return this.$el.find('.highlightParent').on('click', function() {
          return _this.facade.trigger('highlightParent');
        });
      };

      Lipsum.prototype.highlightSelf = function() {
        var _this = this;
        this.$el.css({
          background: 'lightgreen'
        });
        return setTimeout(function() {
          return _this.$el.css({
            background: 'whitesmoke'
          });
        }, 500);
      };

      return Lipsum;

    })();
  });

}).call(this);
