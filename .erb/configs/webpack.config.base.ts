/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import tsImportPluginFactory from 'ts-import-plugin';
import createStyledComponentsTransformer from 'typescript-plugin-styled-components';

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
                // @see https://github.com/Igorbek/typescript-plugin-styled-components#ts-loader
                createStyledComponentsTransformer({
                  ssr: true, // always enable it to make all styled generated component has id.
                  displayName: isDevelopment,
                  minify: false, // it's still an experimental feature
                  componentIdPrefix: 'rd-',
                }),
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
      HTTP_INSTEAD_OF_CUSTOM: process.env.HTTP_INSTEAD_OF_CUSTOM || '',
    }),
  ],
};

export default configuration;
