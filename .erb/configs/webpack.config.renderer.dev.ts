import 'webpack-dev-server';
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import { execSync, spawn } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
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

  entry: {
    // 'renderer': [
    //   `webpack-dev-server/client?http://localhost:${port}/dist`,
    //   'webpack/hot/only-dev-server',
    //   path.join(webpackPaths.srcRendererPath, 'index.tsx'),
    // ],
    renderer: path.join(webpackPaths.srcRendererPath, 'index.tsx'),
  },

  output: {
    path: webpackPaths.distRendererPath,
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

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),

    new ReactRefreshWebpackPlugin(),

    ...webpackPaths.rendererEntries.map(({ name, target, htmlFile }) => {
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
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  devServer: {
    port,
    compress: true,
    hot: false,
    liveReload: false,
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
    setupMiddlewares(middlewares) {
      console.log('Starting shell builder...');
      const shellProcess = spawn('npm', ['run', 'start:shell'], {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code: number) => process.exit(code!))
        .on('error', (spawnError) => console.error(spawnError));

      console.log('Starting preload.js builder...');
      const preloadProcess = spawn('npm', ['run', 'start:preload'], {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code: number) => process.exit(code!))
        .on('error', (spawnError) => console.error(spawnError));

      main_process: {
        console.log('Starting Main Process...');
        let mainArgs = ['run', 'start:main'];
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
              shellProcess.kill();
              preloadProcess.kill();
              process.exit(code!);
            })
            .on('error', (spawnError) => console.error(spawnError));
        }, 8000);
      }
      return middlewares;
    },
  },
};

export default merge(baseConfig, configuration);
