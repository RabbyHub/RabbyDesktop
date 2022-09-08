/**
 * Build config for electron renderer process
 */

import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import deleteSourceMaps from '../scripts/delete-source-maps';
import { getProdStyleLoaders } from './common';

checkNodeEnv('production');
deleteSourceMaps();

const configuration: webpack.Configuration = {
  devtool: 'source-map',

  mode: 'production',

  target: ['web', 'electron-renderer'],

  entry: {
    webui: path.join(webpackPaths.srcShellPath, 'webui.tsx'),
  },

  output: {
    path: webpackPaths.distShellPath,
    publicPath: './webui/',
    filename: 'webui.js',
    library: {
      type: 'umd',
    },
  },

  module: {
    rules: [
      ...getProdStyleLoaders(),
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Images
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
      new CssMinimizerPlugin(),
    ],
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
    }),

    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
    }),

    ...['webui', 'new-tab'].map(html => {
      return new HtmlWebpackPlugin({
        filename: path.join(`${html}.html`),
        template: path.join(webpackPaths.srcShellPath, `${html}.ejs`),
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
        },
        inject: html === 'webui',
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV !== 'production',
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(webpackPaths.srcShellPath, 'manifest.json'), to: path.join(webpackPaths.distShellPath, 'manifest.json') },
      ],
    }),

    new webpack.DefinePlugin({
      'process.type': '"webui"',
    }),
  ],
};

export default merge(baseConfig, configuration);
