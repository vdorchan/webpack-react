const fs = require('fs')
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (webpackEnv, argv) => {
  const isDevelopment = argv.mode === 'development'
  const isProduction = argv.mode === 'production'

  const appDirectory = fs.realpathSync(process.cwd())
  const appSrc = path.resolve(appDirectory, 'src')
  const appIndexJS = path.resolve(appDirectory, 'src/index.jsx')
  const appHtml = path.resolve(appDirectory, 'public/index.html')

  const appBuild = path.resolve(appDirectory, 'dist')

  return {
    entry: appIndexJS,
    output: {
      path: appBuild,
      filename: 'static/js/[name].[contenthash:8].js',
      publicPath: '/',
      // Clean the output directory before emit.
      clean: true
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
      ],
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: appHtml,
      }),
    ],
    resolve: {
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx'],
    },
  }
}
