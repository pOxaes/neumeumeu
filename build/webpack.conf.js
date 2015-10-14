var Webpack = require('webpack'),
    conf = require('./conf.js');

var webpackConf = {
    entry: {
        app: process.cwd() + '/src/scripts/index.js',
        vendor: Object.keys(conf.pkg.dependencies)
    },
    output: {
        path: 'dist/scripts/',
        filename: 'app.js'
    },

    cache: conf.devMode,
    debug: conf.devMode,
    devtool: conf.devMode ? 'source-map' : false,
    stats: {
        colors: true,
        reasons: conf.devMode
    },

    resolve: {
        extensions: ['', '.js'],
        alias: {
            'components': process.cwd() + '/src/scripts/components',
            'actions': process.cwd() + '/src/scripts/actions',
            'stores': process.cwd() + '/src/scripts/stores'
        }
    },

    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel'
        }]
    },
    plugins: [
        new Webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js')
    ],
    eslint: {
        emitErrors: !conf.devMode
    }
};

if (conf.optimize) {
    webpackConf.plugins = webpackConf.plugins.concat([
        new Webpack.optimize.DedupePlugin(),
        new Webpack.optimize.OccurenceOrderPlugin(),
        new Webpack.optimize.AggressiveMergingPlugin(),
        new Webpack.optimize.UglifyJsPlugin({
            output: {
                comments: false
            }
        })
    ]);
}

module.exports = webpackConf;