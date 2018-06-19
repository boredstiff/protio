var gulp = require('gulp')
var git = require('gulp-git')
var gitRev = require('git-rev')
var gulpDocumentation = require('gulp-documentation')
var runSequence = require('run-sequence')
var changed = require('gulp-changed')
var sass = require('gulp-sass')
var notify = require('gulp-notify')
var paths = require('../paths')
var path = require('path')
var systemJs = require('systemjs-builder')
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

gulp.task('build-docs', function() {
    return gulp.src('./src/js/**/*.js')
        .pipe(gulpDocumentation('html'))
        .pipe(gulp.dest('dist/docs'))
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

// Build the production copy
gulp.task('build-prod-copy', function() {
    function dest(source) {
        var release = path.relative(paths.root, source.base)
        var p = path.resolve(path.relative(source.cwd, paths.outputRoot), release)
        return p
    }

    return gulp.src(paths.prodCopy)
        .pipe(changed(dest))
        .pipe(gulp.dest(dest))
})

// Build the production html files
gulp.task('build-prod-html', function() {
    return gitRev.tag(function (tag) {
        return gitRev.short(function (hash) {
            return gulp.src(paths.html)
                .pipe(changed(paths.htmlOutput))
                .pipe(replace(/GIT_VERSION/g, tag + "-" + hash))
                .pipe(gulp.dest(paths.htmlOutput))
        })
    })
})

// Build the production javascript files
// Because Javascript is fucking garbage
gulp.task('build-prod-js', function() {
    var builder = new systemJs();
    builder.loadConfig('./config.js')

    return gulp.src(paths.jsToBundle)
        .pipe(changed(function(_file) {
            var destination = path.resolve(paths.outputRoot, path.relative(paths.root, _file.path))
            var source = path.basename(_file.path)

            destination = path.relative(_file.cwd, destination)
            // Build the files with no source maps, don't minify it
            builder.buildStatic(
                source, destination, {sourceMaps: false, minify: false, mangle: false})
                .then(function(output) {
                    console.log("Build successful: ", destination)
                })
                .catch(function(err) {
                    console.log("Build failed: ", destination)
                    console.log(err)
                })
            return ""
        }))
})


gulp.task('build-dev', function(callback) {
    return runSequence(
        'clean',
        [
            'build-css',
            'build-sass',
            'build-docs',
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
            'build-premiere-debug'
        ],
        callback
    )
})