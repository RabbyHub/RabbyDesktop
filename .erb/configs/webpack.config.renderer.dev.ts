import 'webpack-dev-server';
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import { ChildProcess, execSync, spawn } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import WindiCSSWebpackPlugin from 'windicss-webpack-plugin';

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

const port = process.env.PORT || 1212;
const manifest = path.resolve(webpackPaths.dllPath, 'renderer.json');
const skipDLLs =
  module.parent?.filename.includes('webpack.config.renderer.dev.dll') ||
  module.parent?.filename.includes('webpack.config.eslint');

/**
 * Warn if the DLL is not built
 */
if (
  !skipDLLs &&
  !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))
) {
  console.log(
    chalk.black.bgYellow.bold(
      'The DLL files are missing. Sit back while we build them for you with "npm run build-dll"'
    )
  );
  execSync('npm run postinstall');
}

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
      ...getWebpackAliases(),
    },
    fallback: {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      assert: false,
      url: false,
      http: false,
      zlib: false,
      https: false,
    },
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
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        resourceQuery: /rc/, // *.svg?rc
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                // ["@babel/typescript", {
                //   allExtensions: true,
                //   isTSX: true,
                // }]
              ],
            },
          },
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              babel: true,
              // typescript: true
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        resourceQuery: { not: [/rc/] },
      },
    ],
  },
  plugins: [
    ...(skipDLLs
      ? []
      : [
          new webpack.DllReferencePlugin({
            context: webpackPaths.dllPath,
            manifest: require(manifest),
            sourceType: 'var',
          }),
        ]),

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

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    }),

    new WindiCSSWebpackPlugin(),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),

    new ReactRefreshWebpackPlugin({ overlay: false }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },
};

const configurationRenderer: webpack.Configuration = {
  entry: {
    ...Object.values(webpackPaths.entriesRenderer).reduce((accu, cur) => {
      // @ts-ignore
      accu[cur.name] = cur.jsEntry;
      return accu;
    }, {}),
  },

  output: {
    path: webpackPaths.distRendererPath,
  },

  plugins: [
    ...Object.values(webpackPaths.entriesRenderer).map(
      ({ name, target, htmlFile }) => {
        return new HtmlWebpackPlugin({
          filename: target,
          template: htmlFile,
          minify: {
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true,
          },
          chunks: [name],
          // templateParameters (compilation, files, tags) {
          //   return {
          //   }
          // },
          hash: !isProduction,
          inject: 'body',
          isBrowser: false,
          env: process.env.NODE_ENV,
          isDevelopment: !isProduction,
          nodeModules: webpackPaths.appNodeModulesPath,
        });
      }
    ),
  ],

  devServer: {
    port,
    compress: true,
    host: 'localhost',
    hot: true,
    // liveReload: false,
    // client: false,
    client: {
      webSocketTransport: 'ws',
    },
    webSocketServer: 'ws',
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: {
      publicPath: '/',
    },
    historyApiFallback: {
      verbose: true,
    },
    devMiddleware: {
      writeToDisk: !process.env.HTTP_INSTEAD_OF_CUSTOM
        ? true
        : (targetPath) => {
            const normalizedPath = targetPath
              .replace(
                /^([a-z])\:\\/gi,
                (_, matched) => `/${matched.toLowerCase()}/`
              )
              .replace(/\\/g, '/');

            const isTargetShell = normalizedPath.includes(
              'assets/desktop_shell'
            );
            return isTargetShell;
          },
    },
    setupMiddlewares(middlewares) {
      console.log('Starting preload.js builder...');
      const preloadProcess = spawn('npm', ['run', 'start:preload'], {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code: number) => process.exit(code!))
        .on('error', (spawnError) => console.error(spawnError));


      if (!process.env.NO_MAIN) {

      let mainJsProcess: ChildProcess;
        // start:main:js
        console.log('Starting builder to compile main.ts -> .erb/dll/main.js...');
        mainJsProcess = spawn('npm', ['run', 'start:main:js'], {
          shell: true,
          stdio: 'inherit',
        })
          .on('close', (code: number) => process.exit(code!))
          .on('error', (spawnError) => console.error(spawnError));

        // start:main:electronmon
        console.log('Starting Main Process...');
        let mainArgs = ['run', 'start:main:electronmon'];
        if (process.env.MAIN_ARGS) {
          mainArgs = mainArgs.concat(
            ['--', ...process.env.MAIN_ARGS.matchAll(/"[^"]+"|[^\s"]+/g)].flat()
          );
        }
        setTimeout(() => {
          spawn('npm', mainArgs, {
            shell: true,
            stdio: 'inherit',
          })
            .on('close', (code: number) => {
              preloadProcess.kill();
              mainJsProcess.kill();
              process.exit(code!);
            })
            .on('error', (spawnError) => console.error(spawnError));
        }, 15 * 1e3);
      }

      return middlewares;
    },
  },
};

const configurationShell: webpack.Configuration = {
  entry: {
    [webpackPaths.entriesShell['_shell-webui'].name]:
      webpackPaths.entriesShell['_shell-webui'].jsEntry,
    [webpackPaths.entriesShell['_shell-new-tab'].name]:
      webpackPaths.entriesShell['_shell-new-tab'].jsEntry,
    [webpackPaths.entriesShell['_shell-popup-view'].name]:
      webpackPaths.entriesShell['_shell-popup-view'].jsEntry,
  },
  output: {
    path: path.join(webpackPaths.assetsPath, 'desktop_shell'),
  },
  plugins: [
    ...Object.values(webpackPaths.entriesShell)
      .filter((item) => !!item.htmlFile)
      .map(({ name, target, htmlFile }) => {
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
        {
          from: path.join(
            webpackPaths.srcPath,
            'extension-shell/manifest.json'
          ),
          to: path.join(webpackPaths.assetsPath, 'desktop_shell/manifest.json'),
        },
        {
          from: path.join(
            webpackPaths.distExtsPath,
            'rabby/vendor/matomo.client.js'
          ),
          to: path.join(webpackPaths.assetsPath, 'desktop_shell/vendor/'),
        },
      ],
    }),
  ],
};

// const configurationRabby: webpack.Configuration = {
//   entry: {
//     // [webpackPaths.entriesRabby['rabby-background'].name]: webpackPaths.entriesRabby['rabby-background'].jsEntry,
//     // [webpackPaths.entriesRabby['rabby-content-script'].name]: webpackPaths.entriesRabby['rabby-content-script'].jsEntry,
//     [webpackPaths.entriesRabby['rabby-popup'].name]: webpackPaths.entriesRabby['rabby-popup'].jsEntry,
//   },
//   output: {
//     path: path.join(webpackPaths.distExtsPath, 'rabby'),
//   },
//   module: {
//     rules: [{ oneOf: [
//       {
//         test: /src\/extension-wallet/,
//         use: [
//           {
//             loader: 'ts-loader',
//             options: {
//               transpileOnly: true,
//               getCustomTransformers: () => ({
//                 before: [
//                   tsImportPluginFactory({
//                     libraryName: 'antd',
//                     libraryDirectory: 'lib',
//                     style: true,
//                   }),
//                 ],
//               }),
//               compilerOptions: {
//                 module: 'es2015',
//               },
//             },
//           },
//           {
//             loader: path.resolve(
//               webpackPaths.rootPath,
//               'node_modules/antd-dayjs-webpack-plugin/src/init-loader'
//             ),
//             options: {
//               plugins: [
//                 'isSameOrBefore',
//                 'isSameOrAfter',
//                 'advancedFormat',
//                 'customParseFormat',
//                 'weekday',
//                 'weekYear',
//                 'weekOfYear',
//                 'isMoment',
//                 'localeData',
//                 'localizedFormat',
//               ],
//             },
//           },
//         ],
//       }
//     ]}]
//   },
//   plugins: [
//     ...Object.values(webpackPaths.entriesRabby).filter(item => !!item.htmlFile).map(({ name, target, htmlFile }) => {
//       return new HtmlWebpackPlugin({
//         filename: target,
//         template: htmlFile,
//         minify: {
//           collapseWhitespace: true,
//           removeAttributeQuotes: true,
//           removeComments: true,
//         },
//         chunks: [name],
//         hash: !isProduction,
//         inject: 'body',
//         isBrowser: false,
//         env: process.env.NODE_ENV,
//         isDevelopment: !isProduction,
//         nodeModules: webpackPaths.appNodeModulesPath,
//       });
//     }),

//     // new CopyWebpackPlugin({
//     //   patterns: [
//     //     { from: path.join(webpackPaths.rootPath, 'assets/_raw/'), to: path.join(webpackPaths.distExtsPath, './rabby/') },
//     //   ],
//     // })
//   ],

//   optimization: {
//     splitChunks: {
//       cacheGroups: {
//         'webextension-polyfill': {
//           minSize: 0,
//           test: /[\\/]node_modules[\\/]webextension-polyfill/,
//           name: 'webextension-polyfill',
//           chunks: 'all',
//         },
//       },
//     },
//   },
// };

export default [
  merge(baseConfig, configuration, configurationRenderer),
  merge(baseConfig, configuration, configurationShell),
  // merge(baseConfig, configuration, configuration, configurationRabby),
];
