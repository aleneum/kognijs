// "use strict";

var macros = require('../src/helpers').macros;
var Config = require('../src/config');
var configuration = {rsb: {prefix: "/test/scope"}};

describe("Macros test", function () {

  it('should return scopes',function() {
    var config = new Config(configuration);
    var absolute = macros({config: config}).mangleScope('foo');
    expect(absolute).to.be.equal('/test/scope/foo');
    absolute = macros(config).mangleScope('/foo');
    var empty = new Config({});
    absolute = macros({config: empty}).mangleScope('foo');
    expect(absolute).to.be.equal('/foo');
  });

});
