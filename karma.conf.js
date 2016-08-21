var istanbul = require('browserify-istanbul');
var proxyquire = require('proxyquireify');
var browserifyOptional = require('browserify-optional');

module.exports = function(config) {
  config.set({
    browsers: ['Firefox'],
    frameworks: ['mocha', 'sinon-chai', 'browserify'],
    files: [
      {pattern: 'examples/data/*.xml', watched: true, included: false, served: true},
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'src/*.js': ['coverage'],
      'test/**/*.spec.js': [ 'browserify' ]
    },
    autoWatch: true,
    watchify: {
      poll: true
    },
    client: {
      chai: {
        includeStack: true
      }
    },
    browserify: {
      debug: true,
      transform: [
        istanbul({ignore: ['**/node_modules/**'],}),
        browserifyOptional
      ],
      plugin: ['proxyquire-universal']
    },
    reporters: ['coverage', 'progress'],
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: 'coverage/' },
        { type: 'text-summary'}
      ],
    },
  });
};
