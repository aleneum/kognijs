"use strict";

var connectStub, isConnectedStub, createListenerStub, createInformerStub, getDefaultStub;
var UI = require('../src/ui.js');
var RSB = require('kognijs-rsb');

var contentHTML = '<div id="canvasArea"></div>' +
  '<div style="position: absolute; top: 0px; left:0px; width: 200px; height:200px;" id="contentArea"></div>';

function WidgetStub() {
}
WidgetStub.prototype.update = function(value){};
WidgetStub.prototype.reset = function(){};


describe("UI", function () {

  beforeEach(function () {
    document.body.innerHTML = '';
    document.body.insertAdjacentHTML(
      'afterbegin',
      contentHTML
    );
    this.sinon = sinon.sandbox.create();
    connectStub = this.sinon.stub(RSB.prototype, 'connect', function(url, callback){
      callback();
    });
    isConnectedStub = this.sinon.stub(RSB.prototype, 'isConnected', function() { return true; });
    createListenerStub = this.sinon.stub(RSB.prototype, 'createListener', function(params) {
      if (params.scope.endsWith("/scope")) {
        params.callback({text:'FooBar'})
      } else if (params.scope.endsWith('/bar')) {
        params.callback('FooBar');
      }
    });
    createInformerStub = this.sinon.stub(RSB.prototype, 'createInformer', function() {return {}});
    getDefaultStub = this.sinon.stub(RSB, 'getDefault', function(type) {return 'stub'});
  });

  afterEach(function(){
    this.sinon.restore();
  });

  it('should init UI', function (done) {
    var model = {};
    var ui = new UI('base/examples/data/tour.xml', {});
    ui.init(function (err) {
      expect(ui.projection).to.not.be.an('undefined');
      done(err);
    })
  });

  it('should init UI with custom widget', function (done) {
    var model = {};
    var widgetUpdateSpy = this.sinon.spy(WidgetStub.prototype, 'update');
    var ui = new UI('base/examples/data/tour.xml', {});
    ui.widgetDefinitions['WidgetStub'] = WidgetStub;
    ui.init(function (err) {
      ui.config.json.widgetList.widget.push({scope:'/foo/bar', type:'WidgetStub', value:'string'});
      ui._loadWidgets();
      expect(widgetUpdateSpy.calledWith('FooBar')).to.be.true;
      done();
    })
  });
});
