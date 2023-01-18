import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import webpackPaths from './webpack.paths';

export function getSvgSpriteLoaders() {
  return {
    test: /\.svg$/,
    issuer: /\.[jt]sx?$/,
    loader: 'svg-sprite-loader',
    resourceQuery: { not: [/rc/] },
    // include: [
    // ],
    options: {
      extract: true,
      symbolId: (filePath: string) => {
        const fname = path.dirname(filePath).replace(/\\/g, '/');
        let baseName = path.basename(filePath, '.svg');
        if (baseName.indexOf(process.platform) === 0) {
          baseName = baseName.slice(process.platform.length);
        }
        return `${fname.split('/').pop()}#${baseName}`;
      },
      spriteFilename: 'desktop.sp.svg',
      outputPath: './assets/generated/',
      publicPath: 'rabby-internal://local/assets/generated/'
    }
  };
}

export function getDevStyleLoaders () {
  return [
    {
      test: /\.s?css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: true,
            sourceMap: true,
            importLoaders: 1,
          },
        },
        'sass-loader',
      ],
      include: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.s?css$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      exclude: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.less$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              mode: "local",
              auto: true,
              // @see https://www.npmjs.com/package/css-loader#modules
              localIdentName: "[local]--[hash:base64:5]",
            },
            sourceMap: true,
            importLoaders: 1,
          },
        },
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
      include: /\.module\.less$/,
    },
    {
      test: /\.less$/,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        }
      ],
      exclude: /\.module\.less$/,
    },
  ]
}

export function getProdStyleLoaders () {
  return [
    {
      test: /\.s?(a|c)ss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: true,
            sourceMap: true,
            importLoaders: 1,
          },
        },
        'sass-loader',
      ],
      include: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.s?(a|c)ss$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      exclude: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.less$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: true,
            sourceMap: true,
            importLoaders: 1,
          },
        },
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        }
      ],
      include: /\.module\.less$/,
    },
    {
      test: /\.less$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        }
      ],
      exclude: /\.module\.less$/,
    },
  ]
}

const ROOT = path.resolve(__dirname, '../../');

export function getWebpackAliases () {
  return {
    '@': path.resolve(ROOT, 'src'),
    '@root': path.resolve(ROOT),
  } as Exclude<import('webpack').Configuration['resolve'], void>['alias']
}
