"use strict";
var PointingOverlay = require('../src/pointing');

var targetHTML = '<div id="target"></div>';

describe("Pointing", function () {
  beforeEach(function() {
    document.body.innerHTML = '';
    document.body.insertAdjacentHTML(
      'afterbegin',
      targetHTML
    );
  });

  it('should create an overlay and setup', function(done) {
    var elem = document.getElementById('target');
    var overlay = new PointingOverlay(elem, undefined);
    overlay.setup();
    done();
  });

  it('should create an overlay and trigger it', function(done) {
    var elem = document.getElementById('target');
    var overlay = new PointingOverlay(elem, undefined);
    overlay.trigger();
    expect(overlay.state).to.be.equal(1);
    expect(overlay.timeout > 0).to.be.True;
    setTimeout(function() {
      expect(overlay.state).to.be.equal(0);
      expect(overlay.timeout < 0).to.be.True;
      done();
    }, 1000);
  });

  it('should create an overlay and click it', function(done) {
    this.timeout(3000);
    var elem = document.getElementById('target');
    var overlay = new PointingOverlay(elem, function(){done()});
    overlay.trigger();
    setInterval(function() {
      overlay.trigger();
    }, 200);
  });
});
