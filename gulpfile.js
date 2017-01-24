"use strict";
var _ = require('lodash');
var fs = require('fs');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var nodeResolve = require('resolve');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var Server = require('karma').Server;

var production = (process.env.NODE_ENV === 'production');

gulp.task('default', ['serve']);

gulp.task('serve', ['build-vendor', 'build-tour', 'browser-sync'], function () {
  gulp.watch('src/**/*.js', ['build-tour', reload]);
  gulp.watch('examples/*.html', reload);
  gulp.watch('tests/*.html', reload);
});

gulp.task('browser-sync', function() {
  browserSync({
    open: false,
    server: {
      baseDir: ["examples", "dist", "test"],
      index: "tour.html"
    },
  });
});

gulp.task('build-vendor', function () {

  var b = browserify({
    debug: !production
  });

  // do the similar thing, but for npm-managed modules.
  // resolve path using 'resolve' module
  getNPMPackageIds().forEach(function (id) {
    b.require(nodeResolve.sync(id), { expose: id });
  });

  var stream = b
    .bundle()
    .on('error', function(err){
      // print the error (can replace with gulp-util)
      console.log(err.message);
      // end this stream
      this.emit('end');
    })
    .pipe(source('vendor.js'));

  // pipe additional tasks here (for eg: minifying / uglifying, etc)
  // remember to turn off name-mangling if needed when uglifying

  stream.pipe(gulp.dest('./dist'));

  return stream;
});

gulp.task('build-tour', function () {

  var b = browserify([
      'src/main.js',
      'src/vueExample.js'
  ], {
    // generate source maps in non-production environment
    debug: !production
  });

  getNPMPackageIds().forEach(function (id) {
    b.external(id);
  });

  var stream = b.bundle().pipe(source('kognijs.tour.js'));
  stream.pipe(gulp.dest('./dist'));

  return stream;
});

gulp.task('test-travis', function (done) {
  new Server({
    configFile: __dirname + '/karma.travis.conf.js',
    singleRun: true
  }, function(){done();}).start();
});

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, function(){done();}).start();
});

gulp.task('build-redist', function() {
  return browserify([
        'src/main.js'
      ],  {
        debug: !production,
      })
      .bundle()
      .pipe(source('kognijs.min.js'))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest('redist/'));
});

/**
 * Helper function(s)
 */

function getNPMPackageIds() {
  var packageManifest = {};
  try {
    packageManifest = require('./package.json');
  } catch (e) {
    // does not have a package.json manifest
  }
  return _.keys(packageManifest.dependencies) || [];

}
