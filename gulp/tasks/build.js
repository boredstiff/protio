var gulp = require('gulp')
var git = require('gulp-git')
var gitRev = require('git-rev')
var runSequence = require('run-sequence')
var changed = require('gulp-changed')
var sass = require('gulp-sass')
var notify = require('gulp-notify')
var paths = require('../paths')
var path = require('path')
var systemJS = require('systemjs-builder')
var replace = require('gulp-replace')
var vinylFS = require('vinyl-fs')

gulp.task('build-css', function() {
    return gulp.src(paths.css)
        .pipe(changed(paths.outputRoot, {extension: 'css'}))
        .pipe(gulp.dest(paths.outputRoot))
})

gulp.task('build-sass', function() {
    gulp.src(paths.sass)
        .pipe(sass().on('error', notify.onError('Error: <%= error.message %>')))
        .pipe(gulp.dest(paths.outputRoot))
})

gulp.task('build-dev-copy-jspm-config', function() {
    return gulp.src(paths.devJSPMCopy)
        .pipe(changed(paths.outputRoot))
        .pipe(gulp.dest(paths.outputRoot))
})

gulp.task('build-dev-html', function() {
    return gitRev.tag(function(tag) {
        return gitRev.short(function(hash) {
            return gulp.src(paths.html)
                .pipe(changed(paths.htmlOutput))
                .pipe(replace(/<!-- GULP: PROD --\>(.|\n|\r)*?<!-- GULP: ENDPROD --\>/g, ""))
                .pipe(replace(/GIT_VERSION/g, tag + "-" + hash))
                .pipe(gulp.dest(paths.htmlOutput));
        })
    })
})

gulp.task('build-dev-symlinks', function() {
    return vinylFS.src(paths.devSymlinks, {followSymlinks: false})
        .pipe(vinylFS.symlink(paths.outputRoot))
})

gulp.task('build-premiere-debug', function() {
  return gulp.src(paths.premiereDebug)
    .pipe(changed(paths.outputRoot))
    .pipe(gulp.dest(paths.outputRoot));
})

// Config used for dev env
// Sets up config to use the js folder since we don't
// have a src folder in the dist
// We keep the main src folder so we can bundle
gulp.task('build-dev-config', function () {
  return gulp.src(paths.configjs)
    .pipe(changed(paths.outputRoot))
    .pipe(replace(/\"src\/js\/\*\"/, "\"js/*\""))
    .pipe(gulp.dest(paths.outputRoot));
})

gulp.task('build-dev', function(callback) {
    return runSequence(
        'clean',
        [
            'build-css',
            'build-sass',
            'build-dev-html',
            'build-dev-config',
            'build-premiere-debug',
            'build-dev-symlinks',
            'build-dev-copy-jspm-config',
        ],
        callback
    )
})

gulp.task('build-prod', function(callback) {
    return runSequence(
        'clean',
        [
            'build-css',
            'build-sass',
            'build-prod-copy',
            'build-prod-html',
            'build-prod-js',
            'build-premieredebug'
        ],
        callback
    )
})