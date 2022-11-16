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
import { getProdStyleLoaders, getWebpackAliases } from './common';

checkNodeEnv('production');
deleteSourceMaps();

const configuration: webpack.Configuration = {
  devtool: 'source-map',

  mode: 'production',

  target: ['web', 'electron-renderer'],

  output: {
    publicPath: './',
    filename: '[name].js',
    library: {
      type: 'umd',
    },
  },

  resolve: {
    alias: {
      ...getWebpackAliases()
    }
  },

  module: {
    rules: [
      ...getProdStyleLoaders(),
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        resourceQuery: /rc/, // *.svg?rc
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              babel: true,
            },
          },
        ],
      },
      // Images
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        resourceQuery: { not: [/rc/] },
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
      filename: '[name].css',
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
    }),

    new webpack.DefinePlugin({
      'process.type': '"renderer"',
    }),
  ],
};

const configurationRenderer: webpack.Configuration = {
  entry: {
    ...Object.values(webpackPaths.entriesRenderer).reduce((accu, cur) => {
      accu[cur.name] = cur.jsEntry;
      return accu;
    }, {})
  },

  output: {
    path: webpackPaths.distRendererPath,
  },

  plugins: [
    ...Object.values(webpackPaths.entriesRenderer).map(({ name, target, htmlFile }) => {
      return new HtmlWebpackPlugin({
        filename: target,
        template: htmlFile,
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
        },
        chunks: [name],
        inject: true,
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV !== 'production',
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),
  ],
};

const configurationShell: webpack.Configuration = {
  entry: {
    [webpackPaths.entriesShell['_shell-webui'].name]: webpackPaths.entriesShell['_shell-webui'].jsEntry,
    [webpackPaths.entriesShell['_shell-new-tab'].name]: webpackPaths.entriesShell['_shell-new-tab'].jsEntry,
  },

  output: {
    path: path.join(webpackPaths.assetsPath, './desktop_shell'),
  },

  plugins: [
    ...Object.values(webpackPaths.entriesShell).filter(item => !!item.htmlFile).map(({ name, target, htmlFile }) => {
      return new HtmlWebpackPlugin({
        filename: target,
        template: htmlFile,
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
        },
        chunks: [name],
        inject: true,
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV !== 'production',
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(webpackPaths.srcPath, 'extension-shell/manifest.json'), to: path.join(webpackPaths.assetsPath, 'desktop_shell/manifest.json') },
      ],
    })
  ],
};

const configurationRabby: webpack.Configuration = {
  entry: {
    // [webpackPaths.entriesRabby['rabby-background'].name]: webpackPaths.entriesRabby['rabby-background'].jsEntry,
    // [webpackPaths.entriesRabby['rabby-content-script'].name]: webpackPaths.entriesRabby['rabby-content-script'].jsEntry,
  },

  output: {
    path: path.join(webpackPaths.distExtsPath, './rabby'),
  },

  plugins: [
    ...Object.values(webpackPaths.entriesRabby).filter(item => !!item.htmlFile).map(({ name, target, htmlFile }) => {
      return new HtmlWebpackPlugin({
        filename: target,
        template: htmlFile,
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
        },
        chunks: [name],
        inject: true,
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV !== 'production',
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(webpackPaths.rootPath, 'assets/_raw/'), to: path.join(webpackPaths.distExtsPath, './rabby/') },
      ],
    })
  ],
};

export default [
  merge(baseConfig, configuration, configurationRenderer),
  merge(baseConfig, configuration, configurationShell),
  // merge(baseConfig, configuration, configurationRabby),
];
