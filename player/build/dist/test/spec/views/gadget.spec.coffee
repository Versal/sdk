define [
  'helpers/helpers'
  'helpers/fixtures'
  'views/gadget_instance'
], (Helpers, Fixtures, GadgetInstanceView) ->

  beforeEach ->
    @model = new GadgetInstanceView

  describe 'Gadget View', ->
