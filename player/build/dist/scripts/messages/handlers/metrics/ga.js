(function() {

  define([], function() {
    var ga, s, _gaq;
    _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-34216821-1']);
    _gaq.push(['_setDomainName', 'versal.com']);
    _gaq.push(['_trackPageview']);
    ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    return function(category, action, data) {
      return _gaq.push(['_trackEvent', category, action, JSON.stringify(data)]);
    };
  });

}).call(this);
