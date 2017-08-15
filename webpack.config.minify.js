const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  target: 'web',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'aframe-lsystem-component.min.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true
          }
        }
      },

    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new UglifyJSPlugin({
      uglifyOptions: {
          compress: {dead_code: true, conditionals: true, evaluate: true, loops: true, unused: true, reduce_vars: true, passes: 1, hoist_funs: true, hoist_vars: true, inline: true, keep_fargs: false, unsafe: true, comparisons: true, unsafe_comps: true},
          mangle: {keep_fnames: false, reserved: ['LSystem', 'LSystemWorker', 'worker'], toplevel: true},
          ie8: false
        }
    })
  ],
};
