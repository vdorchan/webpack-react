const fs = require('fs')
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (webpackEnv, argv) => {
  const isDevelopment = argv.mode === 'development'
  const isProduction = argv.mode === 'production'

  const appDirectory = fs.realpathSync(process.cwd())
  const appSrc = path.resolve(appDirectory, 'src')
  const appIndexJS = path.resolve(appDirectory, 'src/index.jsx')
  const appHtml = path.resolve(appDirectory, 'public/index.html')

  const publicUrlOrPath = '/'

  const appBuild = path.resolve(appDirectory, 'dist')

  return {
    // https://github.com/webpack/webpack-dev-server/issues/2758
    target: 'web',
    entry: appIndexJS,
    output: {
      path: appBuild,
      // filename: 'static/js/[name].[contenthash:8].js',
      filename: isProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isDevelopment && 'static/js/[name].bundle.js',
      publicPath: publicUrlOrPath,
      // Clean the output directory before emit.
      clean: true,
    },
    module: {
      rules: [
        // Process application JS with Babel.
        {
          test: /\.jsx?$/,
          include: appSrc,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: true,
                // Difault, each Babel transform output will be compressed with Gzip.
                cacheCompression: false,
              },
            },
          ],
        },

        {
          test: /\.css$/,
          include: appSrc,
          use: [
            // In production, we use MiniCSSExtractPlugin to extract that CSS.
            isProduction && {
              loader: MiniCssExtractPlugin.loader,
            },
            // turns CSS into JS modules that inject <style> tags.
            isDevelopment && require.resolve('style-loader'),
            // resolves paths in CSS and adds assets as dependencies.
            {
              loader: require.resolve('css-loader'),
            },
          ].filter(Boolean),
        },
      ],
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: appHtml,
      }),

      isProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
    ].filter(Boolean),
    resolve: {
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx'],
    },
  }
}
