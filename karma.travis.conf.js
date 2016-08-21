var istanbul = require('browserify-istanbul');
var proxyquire = require('proxyquireify');
var browserifyOptional = require('browserify-optional');

module.exports = function(config) {
  config.set({
    browsers: ['Firefox'],
    frameworks: ['mocha', 'sinon-chai', 'browserify'],
    files: [
      {pattern: 'examples/data/*.xml', watched: false, included: false, served: true},
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'test/**/*.spec.js': [ 'browserify' ]
    },
    client: {
      chai: {
        includeStack: true
      }
    },
    browserify: {
      debug: true,
      transform: [istanbul({ignore: ['**/node_modules/**'],}),
                  browserifyOptional],
      plugin: ['proxyquire-universal']
    },
    reporters: ['coverage', 'coveralls'],
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: 'coverage/' }
      ],
    },
  });
};
