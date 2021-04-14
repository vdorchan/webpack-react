const fs = require('fs')
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const loaderUtils = require('loader-utils')
const postcssNormalize = require('postcss-normalize')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const paths = require('./paths')

module.exports = (webpackEnv, argv) => {
  const isDevelopment = argv.mode === 'development'
  const isProduction = argv.mode === 'production'

  return {
    // https://github.com/webpack/webpack-dev-server/issues/2758
    target: 'web',
    entry: paths.appIndexJS,
    output: {
      path: paths.appBuild,
      // filename: 'static/js/[name].[contenthash:8].js',
      filename: isProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isDevelopment && 'static/js/[name].bundle.js',
      publicPath: paths.publicUrlOrPath,
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
              include: paths.appSrc,
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    cacheDirectory: true,
                    // Difault, each Babel transform output will be compressed with Gzip.
                    cacheCompression: false,
                    plugins: [
                      isDevelopment && require.resolve('react-refresh/babel'),
                    ].filter(Boolean),
                  },
                },
              ],
            },

            {
              test: /\.css$/,
              include: paths.appSrc,
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
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
      }),

      isProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),

      isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    resolve: {
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json'],
    },
    devServer: {
      contentBase: paths.appBuild,
      contentBasePublicPath: paths.publicUrlOrPath,
      compress: true,
      hot: true,
      port: 9000,
    },
  }
}
