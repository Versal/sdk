define [
  'messages/channel'
], (Channel) ->

  class Mediator

    constructor: ->
      @channels = new Channel

    getChannel: (name) ->
      address = name.split ':'
      channel = @channels

      while address.length
        segment = address.shift()
        channels = channel.channels
        channels[segment] ||= new Channel
        channel = channels[segment]

      channel

    on: (name, callback, context) ->
      channel = @getChannel name
      channel.on callback, (context ?= @)
 
    off: (name, callback, context) ->
      channel = @getChannel name
      channel.off callback, (context ?= @)

    trigger: (name, data...) ->
      address = name.split ':'
      channel = @channels
      while address.length
        break unless channel = channel.channels[address.shift()]
        if address.length
          channel.trigger address.join(':'), data...
        else
          channel.trigger data...

    triggerGadgetEvent: (gadgetId, name, args...) ->
      name = "gadget:#{gadgetId}:#{name}"
      @trigger name, args...

