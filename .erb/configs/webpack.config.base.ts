/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import tsImportPluginFactory from 'ts-import-plugin';

import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

const isDevelopment = process.env.NODE_ENV !== 'production';

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {})],

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: /src\/renderer/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: process.platform === 'darwin',
            getCustomTransformers: () => ({
              before: [
                isDevelopment && require('react-refresh-typescript')(),
                tsImportPluginFactory([
                  {
                    libraryName: 'antd',
                    style: false,
                    // libraryDirectory: 'es'
                  },
                ]),
              ].filter(Boolean),
            }),
            compilerOptions: {
              module: 'es2015',
            },
          },
        },
      },
      {
        test: /\.[jt]sx?$/,
        exclude: [/node_modules/, /src\/renderer/],
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
          },
        },
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      BUILD_CHANNEL: process.env.buildchannel || 'reg',
    }),
  ],
};

export default configuration;
