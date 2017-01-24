
"use strict";

var proxyquire = require('proxyquire');
var connectionError = undefined;

function RSBStub() {}

RSBStub.prototype.connect = function(url, callback) {
  callback(connectionError);
};

RSBStub.prototype.createListener = function(params) {
  if (params.scope.endsWith('pointing')) {params.callback({x: 50, y: 50});}
  else if (params.scope.endsWith('/html')) {params.callback('FooBar');}
  else if (params.scope.endsWith('/canvas')) {params.callback('ctx.fillText("Hello world", 10, 50);');}
  else if (params.scope.endsWith('content/text')) {params.callback('FooBar');}
  else if (params.scope.endsWith('/bar')) {params.callback('FooBar');}
};

RSBStub.prototype.createInformer = function(params) { return {}; };

RSBStub.getDefault = function(type) { return "stub"; };

var UI = proxyquire('../src/ui.js', {'kognijs-rsb': RSBStub });

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
