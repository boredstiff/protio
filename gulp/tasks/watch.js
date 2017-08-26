var gulp = require('gulp')
var paths = require('../paths')

// Watch for changes to js/html/css files and call the reportChange method
gulp.task('watch', ['build-dev'], function() {
    gulp.watch(paths.html, ['build-dev-html'])
    gulp.watch(paths.css, ['build-css'])
    gulp.watch(paths.sass, ['build-sass'])
})
