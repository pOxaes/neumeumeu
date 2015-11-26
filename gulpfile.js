var gulp = require('gulp'),
    GulpUtil = require('gulp-util'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    gIf = require('gulp-if'),

    buildConf = require('./build/conf.js'),
    webpackConf = require('./build/webpack.conf.js'),

    webpack = require('webpack'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul'),
    isparta = require('isparta'),
    eslint = require('gulp-eslint'),

    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyCss = require('gulp-minify-css'),

    devServer = require('./build/server'),
    runSequence = require('run-sequence'),
    del = require('del'),
    path = require('path');

gulp.task('scripts', ['lint'], function(callback) {
    var webpackCallback = function(err, stats) {
        var statsStr = stats.toString({
            colors: true,
            timings: true,
            version: false,
            assets: false,
            chunks: false,
            modules: false,
            errorsDetails: true
        });

        if (stats.hasErrors()) {
            callback(statsStr);
        } else {
            GulpUtil.log('webpack', statsStr);
            callback();
        }
    };

    webpack(webpackConf).run(webpackCallback);
});

gulp.task('lint', function() {
    return gulp.src(buildConf.files.clientJs)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(gIf(buildConf.codeStyle, eslint.failAfterError()));
});

gulp.task('test', function(done) {
    // Code coverage with iSparta, see https://github.com/douglasduteil/isparta/issues/45
    // NB: This MUST be called before, not in mocha({require}), because otherwise
    // it seems to be overwritten by/conflicting with istanbul.hookRequire()...
    // Actual src babelification will be handled by iSparta's instrumenter, the specs
    // babelification will be handled by this hook...
    // It's convoluted and seems brittle...but it works ! ^^
    require('babel-core/register-without-polyfill')({only: new RegExp(buildConf.paths.testBase)});

    gulp.src(buildConf.files.allJs)
        .pipe(istanbul({
            instrumenter: isparta.Instrumenter,
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', function() {
            gulp.src(buildConf.files.testSpecsJs, {read: false})
                .pipe(plumber())
                .pipe(mocha({
                    reporter: 'spec',
                    clearRequireCache: true
                }))
                .pipe(istanbul.writeReports({
                    reporters: [ 'lcov', 'json', 'text-summary', 'html' ]
                }))
                .on('end', done);
        });
});

gulp.task('styles', function() {
    return gulp.src(buildConf.files.clientEntryStyles)
        .pipe(plumber(buildConf.plumber))
        .pipe(sourcemaps.init())
        .pipe(less({paths: 'node_modules'}))
        .pipe(autoprefixer({
            browsers: ['ie >= 9', 'last 2 versions']
        }))
        .pipe(gIf(buildConf.optimize, minifyCss()))
        .pipe(gIf(buildConf.devMode, sourcemaps.write()))
        .pipe(gulp.dest(path.join(buildConf.paths.distBase, 'styles')));
});

gulp.task('assets', function() {
    return gulp.src([
        path.join(buildConf.paths.clientAssetsBase, '/**'),
        buildConf.paths.clientIndex
    ])
        .pipe(gulp.dest(buildConf.paths.distBase));
});

gulp.task('serve', ['serve-build'], function() {
    devServer();
});

gulp.task('watch', function() {
    // Script watch/rebuild is handled directly by webpack
    gulp.watch(buildConf.files.clientJs, ['lint']);
    gulp.watch(buildConf.files.clientStyles, ['styles']);
    gulp.watch([
        path.join(buildConf.paths.srcBase, 'assets', '**'),
        buildConf.paths.clientIndex
    ], ['assets']);
});

gulp.task('clean', function() {
    return del([buildConf.paths.distBase], {
        force: true
    });
});

// serve-build is the same as build, except it doesn't handle scripts
// (handled by wepback-dev-server)
gulp.task('serve-build', function(cb) {
    return runSequence('clean', ['styles', 'assets'], cb);
});

gulp.task('build', function(cb) {
    return runSequence('clean', ['scripts', 'styles', 'assets'], cb);
});

gulp.task('dev', function(cb) {
    return runSequence(['serve', 'watch'], cb);
});

gulp.task('default', ['build']);
