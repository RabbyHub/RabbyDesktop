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
            modules: true,
            sourceMap: true,
            importLoaders: 1,
          },
        },
        'less-loader',
      ],
      include: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader'],
      exclude: /\.module\.s?(c|a)ss$/,
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
        'less-loader',
      ],
      include: /\.module\.s?(c|a)ss$/,
    },
    {
      test: /\.less$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
      exclude: /\.module\.s?(c|a)ss$/,
    },
  ]
}
