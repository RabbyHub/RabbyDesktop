import 'webpack-dev-server';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import { getDevStyleLoaders, getWebpackAliases } from './common';

const isProduction = process.env.NODE_ENV === 'production';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (isProduction) {
  checkNodeEnv('development');
}

const port = process.env.PORT || 1213;

const configuration: webpack.Configuration = {
  devtool: 'inline-source-map',

  mode: 'development',

  target: ['web', 'electron-renderer'],

  output: {
    publicPath: '/',
    filename: '[name].js',
    assetModuleFilename: 'assets/[name].[hash][ext]',
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
      ...getDevStyleLoaders(),
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
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),

    new ReactRefreshWebpackPlugin(),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },
};

const configurationShell: webpack.Configuration = {
  entry: {
    [webpackPaths.entriesShell['_shell-webui'].name]: [
      `webpack-dev-server/client?http://localhost:${port}/dist`,
      'webpack/hot/only-dev-server',
      webpackPaths.entriesShell['_shell-webui'].jsEntry,
    ],
    [webpackPaths.entriesShell['_shell-new-tab'].name]: webpackPaths.entriesShell['_shell-new-tab'].jsEntry,
  },
  output: {
    path: path.join(webpackPaths.assetsPath, 'desktop_shell'),
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
        hash: !isProduction,
        inject: 'body',
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: !isProduction,
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(webpackPaths.srcPath, 'extension-shell/manifest.json'), to: path.join(webpackPaths.assetsPath, 'desktop_shell/manifest.json') },
      ],
    })
  ],
  devServer: {
    port,
    compress: true,
    hot: true,
    // liveReload: true,
    client: false,
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: {
      publicPath: '/',
    },
    historyApiFallback: {
      verbose: true,
    },
    devMiddleware: {
      writeToDisk: (targetpath) => {
        return true
      }
    },
  },
};

const configurationRabby: webpack.Configuration = {
  entry: {
    [webpackPaths.entriesRabby['rabby-background'].name]: webpackPaths.entriesRabby['rabby-background'].jsEntry,
    [webpackPaths.entriesRabby['rabby-content-script'].name]: webpackPaths.entriesRabby['rabby-content-script'].jsEntry,
  },
  output: {
    path: path.join(webpackPaths.distExtsPath, 'rabby'),
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
        hash: !isProduction,
        inject: 'body',
        isBrowser: false,
        env: process.env.NODE_ENV,
        isDevelopment: !isProduction,
        nodeModules: webpackPaths.appNodeModulesPath,
      });
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(webpackPaths.rootPath, 'assets/_raw/'), to: path.join(webpackPaths.distExtsPath, './rabby/') },
      ],
    })
  ],

  optimization: {
    splitChunks: {
      cacheGroups: {
        'webextension-polyfill': {
          minSize: 0,
          test: /[\\/]node_modules[\\/]webextension-polyfill/,
          name: 'webextension-polyfill',
          chunks: 'all',
        },
      },
    },
  },
};

export default [
  merge(baseConfig, configuration, configurationShell),
  // merge(baseConfig, configuration, configurationRabby),
];
