(function() {
  var __slice = [].slice;

  define(['messages/channel'], function(Channel) {
    var Mediator;
    return Mediator = (function() {

      function Mediator() {
        this.channels = new Channel;
      }

      Mediator.prototype.getChannel = function(name) {
        var address, channel, channels, segment;
        address = name.split(':');
        channel = this.channels;
        while (address.length) {
          segment = address.shift();
          channels = channel.channels;
          channels[segment] || (channels[segment] = new Channel);
          channel = channels[segment];
        }
        return channel;
      };

      Mediator.prototype.on = function(name, callback, context) {
        var channel;
        channel = this.getChannel(name);
        return channel.on(callback, (context != null ? context : context = this));
      };

      Mediator.prototype.off = function(name, callback, context) {
        var channel;
        channel = this.getChannel(name);
        return channel.off(callback, (context != null ? context : context = this));
      };

      Mediator.prototype.trigger = function() {
        var address, channel, data, name, _results;
        name = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        address = name.split(':');
        channel = this.channels;
        _results = [];
        while (address.length) {
          if (!(channel = channel.channels[address.shift()])) {
            break;
          }
          if (address.length) {
            _results.push(channel.trigger.apply(channel, [address.join(':')].concat(__slice.call(data))));
          } else {
            _results.push(channel.trigger.apply(channel, data));
          }
        }
        return _results;
      };

      Mediator.prototype.triggerGadgetEvent = function() {
        var args, gadgetId, name;
        gadgetId = arguments[0], name = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        name = "gadget:" + gadgetId + ":" + name;
        return this.trigger.apply(this, [name].concat(__slice.call(args)));
      };

      return Mediator;

    })();
  });

}).call(this);
