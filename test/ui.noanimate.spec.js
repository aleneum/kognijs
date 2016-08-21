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
};

RSBStub.prototype.createInformer = function(params) { return {}; };

RSBStub.getDefault = function(type) { return "stub"; };

var UI = proxyquire('../src/ui.js', { 'kognijs-animate': null, 'kognijs-rsb': RSBStub });
var contentHTML = '<div id="canvasArea"></div>' +
  '<div style="position: absolute; top: 0px; left:0px; width: 200px; height:200px;" id="contentArea"></div>';

describe("UI", function () {

  beforeEach(function(){
    document.body.innerHTML = '';
    document.body.insertAdjacentHTML(
      'afterbegin',
      contentHTML
    );
  });

  // // Configuration has to be passed either in constructor or init
  it('should create KogniUI but throw an error', function(done) {
    var ui = new UI();
    ui.init(function(err) {
      expect(err).to.be.an('Error');
      done();
    })
  });

  it('should not bind RSB', function(done) {
    // Configuration does not provide RSB host information
    var ui = new UI({});
    ui.init(function(err){
      if (err) {done(err);}
      // Configuration does not have a viewmodel declaration
      new UI({rsb: {host:'foo'}, projection: {}}, {}).init(function(err){
        expect(ui.projection).to.be.an('undefined');
        done(err);
      })
    });
  });

  it('should not work due to missing canvas parent', function(done) {
    var ui = new UI({rsb:{host:'localhost', pointing:{path:'foo'}}});
    expect(function() {ui.enableRemoteCanvas('notExisiting')}).to.throw(Error);
    expect(function() {ui.enableRemoteContent('notExisiting')}).to.throw(Error);
    ui.init(function(err) {
      expect(err).to.be.an('Error');
      done();
    });
  });

  it('should init UI but return connection error', function (done) {
    connectionError = new Error('Error stub');
    var ui = new UI('base/examples/data/tour.xml');
    ui.init(function(err) {
      expect(err).to.be.an('Error');
      connectionError = undefined;
      done();
    });
  });

  it('should init UI with stubbed connection', function (done) {
    var ui = new UI('base/examples/data/tour.xml');
    ui.init(function(err) {
      done(err);
    })
  });

  it('should init UI and bind the model', function (done) {
    var model = {};
    var ui = new UI('base/examples/data/tour.xml', model);
    ui.init(function(err) {
      done(err);
    })
  });

  it('shold enable pointing for contentArea', function (done) {
    var ui = new UI({rsb:{pointing:{path:'foo', type:'foo'}}});
    ui.init(function(err) {
      expect(err).to.be.an('undefined');
      expect(function() {ui.enablePointing('NotExisting')}).to.throw(Error);
      ui.enablePointing('contentArea');
      UI.clickSim(50,50);
      var clicked = document.getElementById('contentArea').pointing.state;
      expect(clicked).to.be.equal(1);
      done();
    })
  });

});
