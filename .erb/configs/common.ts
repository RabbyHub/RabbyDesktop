import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

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
    '@debank/common': '@debank/common/dist/index-rabby',
  } as Exclude<import('webpack').Configuration['resolve'], void>['alias']
}
