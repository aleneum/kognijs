"use strict";

var Config = require('../src/config');
var object = {rsb: {prefix: "/test/scope"}};

describe("Macros test", function () {

  it('should initialize configurations', function() {
    var conWithUrl = new Config('base/examples/data/test.xml');
    expect(conWithUrl.json).to.be.an('undefined');
  });

  it('should work with json',function(done) {
    var config = new Config(object);
    expect(config.url).to.be.an('undefined');
    expect(config.json).to.be.an('object');
    expect(config.has('rsb.prefix')).to.be.true;
    expect(config.get('rsb.prefix')).to.be.equal('/test/scope');
    config.set('rsb.prefix', '/test');
    expect(config.get('rsb.prefix')).to.be.equal('/test');
    expect(config.has('not.exisiting')).to.be.false;

    config.set('not.exisiting', '1');
    expect(config.has('not.exisiting')).to.be.true;
    config.init(function() {
      done();
    })
  });

  it('should thrown when trying to access not existing data', function(){
    var config = new Config({a:{}});
    expect(config.has('a.value')).to.be.false;
    expect(function(){config.get('a.value')}).to.throw(Error);
  });

  it('should load an XML configuration', function(done) {
    var config = new Config('base/examples/data/test.xml');
    config.init(undefined, function(err){
        if (err) {done(err);}
        var con = config.json;
        expect(con.rsb.prefix).to.be.equal('/test/scope');
        expect(con.rsb.componentList.component).to.be.an('Array');
        // expect(con.rsb.componentList.component[0]).to.be.equal('button1');
        // expect(con.rsb.viewmodel.componentList.component).to.be.equal('button1');
        done();
    });
  });


  it('should load an XML configuration with explicit arrays', function(done) {
    Config.loadXMLasJSON({
      url: 'base/examples/data/test.xml',
      explicitArray: true,
      callback: function(err, json){
        if (err) {done(err);}
        var config = json.config;
        expect(config.rsb).to.be.an('Array');
        expect(config.rsb[0].prefix[0]).to.be.equal('/test/scope');
        expect(config.rsb[0].componentList[0].component[0]).to.be.equal('button1');
        done();
    }});
  });

  it('should load an XML configuration unified', function(done) {
    Config.loadXMLasJSON({
      url: 'base/examples/data/test.xml',
      checkTagConsistency: 'unify',
      callback: function(err, json){
        if (err) {done(err);}
        var config = json.config;
        expect(config.rsb.prefix).to.be.equal('/test/scope');
        expect(config.rsb.componentList.component).to.be.an('Array');
        expect(config.rsb.componentList.component[0]).to.be.equal('button1');
        expect(config.rsb.viewmodel.componentList.component).to.be.an('Array');
        expect(config.rsb.viewmodel.componentList.component[0]).to.be.equal('button1');
        done();
    }});
  });

  it('should return 404 error', function(done) {
    Config.loadXMLasJSON({
      url: 'base/examples/data/not_existing.xml',
      checkTagConsistency: 'unify',
      callback: function(err){
        expect(err).to.be.an('Error');
        done();
    }});
  });

});
