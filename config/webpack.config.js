const fs = require('fs')
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const loaderUtils = require('loader-utils')
const postcssNormalize = require('postcss-normalize')

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
        {
          oneOf: [
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
                  options: {
                    modules: {
                      getLocalIdent: (
                        context,
                        localIdentName,
                        localName,
                        options
                      ) => {
                        if (context.resourcePath.includes('node_modules')) {
                          return localName
                        }

                        const fileNameOrFolder = context.resourcePath.match(
                          /index\.module\.(css|scss|sass)$/
                        )
                          ? '[folder]'
                          : '[name]'

                        const hash = loaderUtils.getHashDigest(
                          path.posix.relative(
                            context.rootContext,
                            context.resourcePath
                          ) + localName,
                          'md5',
                          'base64',
                          5
                        )

                        const className = loaderUtils.interpolateName(
                          context,
                          fileNameOrFolder + '_' + localName + '__' + hash,
                          options
                        )

                        return className
                      },
                    },
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    postcssOptions: {
                      plugins: ['postcss-preset-env', postcssNormalize()],
                    },
                  },
                },
              ].filter(Boolean),
            },
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.webp/],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: 4 * 1024, // 4kb
                },
              },
              generator: {
                filename: 'static/[hash][ext][query]',
              },
            },
            {
              test: /\.svg$/,
              use: {
                loader: require.resolve('@svgr/webpack'),
              },
            },
            {
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: 'asset/resource',
              generator: {
                filename: 'static/[hash][ext][query]',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
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
    devServer: {
      contentBase: appBuild,
      contentBasePublicPath: publicUrlOrPath,
      compress: true,
      hot: true,
      port: 9000,
    },
  }
}
