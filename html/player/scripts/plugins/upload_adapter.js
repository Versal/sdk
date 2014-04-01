(function() {
  define(['cdn.underscore', 'cdn.backbone'], function(_, Backbone) {
    var UploadAdapter;
    return UploadAdapter = (function() {
      function UploadAdapter(api) {
        this.api = api;
      }

      UploadAdapter.prototype.upload = function(file, model, options) {
        var formData, key, val, _ref;
        formData = new FormData;
        _ref = model.toJSON();
        for (key in _ref) {
          val = _ref[key];
          if (_.isArray(val) || _.isObject(val)) {
            val = JSON.stringify(val);
          }
          formData.append(key, val);
        }
        formData.append('content', file);
        formData.append('contentType', file.type);
        _.extend(options, {
          data: formData,
          cache: false,
          contentType: false,
          processData: false
        });
        return Backbone.sync.apply(this, ['create', model, options]);
      };

      return UploadAdapter;

    })();
  });

}).call(this);
