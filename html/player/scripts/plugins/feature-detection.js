(function() {
  define([], function() {
    var FeatureDetector;
    FeatureDetector = (function() {
      function FeatureDetector() {}

      FeatureDetector.prototype.userAgent = function() {
        return this._userAgent != null ? this._userAgent : this._userAgent = navigator.userAgent.toLowerCase();
      };

      FeatureDetector.prototype.edgeScroll = function() {
        return this.isIE() || this.isChrome();
      };

      FeatureDetector.prototype.isIE = function() {
        return this.userAgent().indexOf('trident') > 0;
      };

      FeatureDetector.prototype.isChrome = function() {
        return this.userAgent().indexOf('chrome') > 0;
      };

      return FeatureDetector;

    })();
    return new FeatureDetector();
  });

}).call(this);
