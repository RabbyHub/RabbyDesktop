/**
 * Webpack config for production electron main process
 */

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import deleteSourceMaps from '../scripts/delete-source-maps';
import { getWebpackAliases } from './common';

checkNodeEnv('production');
deleteSourceMaps();

const gitRevisionPlugin = new GitRevisionPlugin();

const configuration: webpack.Configuration = {
  devtool: 'source-map',

  mode: 'production',

  target: 'electron-main',

  entry: {
    main: path.join(webpackPaths.srcMainPath, 'main.ts'),
    preload: path.join(webpackPaths.srcMainPath, 'preload.ts'),
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [/node_modules/],
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
          },
        },
      },
    ]
  },

  output: {
    path: webpackPaths.distMainPath,
    filename: '[name].js',
  },

  resolve: {
    alias: {
      ...getWebpackAliases()
    }
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
    }),

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
      START_MINIMIZED: false,
    }),

    gitRevisionPlugin,
    new webpack.DefinePlugin({
      'process.type': '"main"',
      // reg, prod
      'process.buildchannel': JSON.stringify(process.env.buildchannel || 'reg'),
      'process.buildarch': JSON.stringify(process.env.buildarch || ''),
      'process.RABBY_DESKTOP_KR_PWD': JSON.stringify(process.env.RABBY_DESKTOP_KR_PWD),

      // 'process.GIT_VERSION': JSON.stringify(gitRevisionPlugin.version()),
      'process.GIT_COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
      // 'process.GIT_BRANCH': JSON.stringify(gitRevisionPlugin.branch()),
      // 'process.GIT_LASTCOMMITDATETIME': JSON.stringify(gitRevisionPlugin.lastcommitdatetime()),
    }),

    new webpack.IgnorePlugin({
      resourceRegExp: /canvas/,
    })
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
};

export default merge(baseConfig, configuration);
