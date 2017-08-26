var appRoot = 'src/'
var outputRoot = 'dist'
var baseRoot = './'

module.exports = {
    root: appRoot,
    baseRoot: baseRoot,
    js: appRoot + 'js/**/*.js',
    jsx: baseRoot + 'jsx/**/*.jsx',
    html: baseRoot + appRoot + 'html/*.html',
    css: appRoot + '**/*.css',
    less: appRoot + '/**/*.less',
    sass: appRoot + '/**/*.scss',
    outputRoot: outputRoot,
    htmlOutput: outputRoot,
    configjs: "config.js",
    doc: './doc',
    premiereTrigger: './.premiere_refresh_trigger',
    premiereDebug: appRoot + './.debug',
    devSymlinks: [
        appRoot + 'CSXS',
        appRoot + 'fonts',
        appRoot + 'js',
        appRoot + 'jsx',
        appRoot + 'lib',
        appRoot + 'python',
        'jspm_packages'
    ],
    devJSPMCopy: [
        'package.json',
        'jsconfig.json'
    ]
}
