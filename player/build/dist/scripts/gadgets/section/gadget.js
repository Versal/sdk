(function() {

  define(['text!./template.html'], function(template) {
    var SectionHeader;
    return SectionHeader = (function() {

      SectionHeader.prototype.className = 'section-header js-sticky-header';

      function SectionHeader(options) {
        this.player = options.player;
        this.config = options.config;
        this.$el = $(options.el);
        this.player.on('toggleEdit', this.toggleEdit, this);
        this.player.on('domReady', this.render, this);
      }

      SectionHeader.prototype.render = function() {
        var content,
          _this = this;
        this.$el.html(template);
        this.$el.addClass(this.className);
        this.text = new vs.ui.EditableText({
          el: this.$el.find('.section-content'),
          type: 'input',
          success: function() {
            return _this.save();
          }
        });
        content = this.config.get('content');
        if (content) {
          return this.text.setText(content);
        } else {
          return this.$el.hide();
        }
      };

      SectionHeader.prototype.toggleEdit = function(editable, options) {
        this.$el.show();
        this.text.toggleEdit(editable, false);
        if (!options.onLoad) {
          return this.$el.find('.section-content').focus();
        }
      };

      SectionHeader.prototype.save = function() {
        return this.config.save('content', this.text.getPretty());
      };

      return SectionHeader;

    })();
  });

}).call(this);
