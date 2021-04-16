const fs = require('fs')
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const loaderUtils = require('loader-utils')
const postcssNormalize = require('postcss-normalize')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const WebpackBar = require('webpackbar')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const paths = require('./paths')
const { clearConsole } = require('../scripts/helper')

const useTypeScript = fs.existsSync(paths.appTsConfig)

module.exports = (webpackEnv, argv) => {
  const isDevelopment = (argv?.mode || webpackEnv) === 'development'
  const isProduction = (argv?.mode || webpackEnv) === 'production'

  const getStyleLoaders = () => {
    return [
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
            getLocalIdent: (context, localIdentName, localName, options) => {
              if (context.resourcePath.includes('node_modules')) {
                return localName
              }

              const fileNameOrFolder = context.resourcePath.match(
                /index\.module\.(css|scss|sass)$/
              )
                ? '[folder]'
                : '[name]'

              const hash = loaderUtils.getHashDigest(
                path.posix.relative(context.rootContext, context.resourcePath) +
                  localName,
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
    ].filter(Boolean)
  }

  return {
    // https://github.com/webpack/webpack-dev-server/issues/2758
    mode: isDevelopment ? 'development' : 'production',
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
    optimization: {
      minimize: isProduction,
      minimizer: [
        compiler => {
          const TerserPlugin = require('terser-webpack-plugin')
          new TerserPlugin({
            terserOptions: {},
          }).apply(compiler)
        },
        new CssMinimizerPlugin(),
      ],
    },
    module: {
      rules: [
        {
          oneOf: [
            // Process application JS with Babel.
            {
              test: /\.(js|jsx|ts|tsx)$/,
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
                    presets: [
                      useTypeScript &&
                        require.resolve('@babel/preset-typescript'),
                    ],
                  },
                },
              ],
            },

            {
              test: /\.css$/,
              include: paths.appSrc,
              use: getStyleLoaders(),
            },
            {
              test: /\.less$/i,
              use: [
                ...getStyleLoaders(),
                {
                  loader: 'less-loader',
                  options: {
                    lessOptions: {
                      javascriptEnabled: true,
                      modifyVars: {
                        '@primary-color': '#5E6EFF',
                        '@input-height-base': '40px',
                        '@btn-height-base': '40px',
                        '@border-color-split': '#EDEFF3',
                        '@input-height-sm': '28px',
                        '@btn-height-sm': '28px',
                        '@btn-danger-bg': '#F5222D',
                        '@border-radius-base': '4px',
                        '@checkbox-size': '14px',
                      },
                      silent: true,
                    },
                  },
                },
              ],
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
        minify: isProduction,
      }),

      isProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),

      isDevelopment && new ReactRefreshWebpackPlugin(),

      new WebpackBar({
        reporter: {
          start(context) {
            isDevelopment && clearConsole()
          },
        },
      }),

      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isDevelopment,
          typescript: {
            configFile: paths.appTsConfig,
            diagnosticOptions: {
              semantic: true,
              syntactic: true,
            },
            // If you use the babel-loader, it's recommended to use write-references mode to improve initial compilation time.
            // If you use ts-loader, it's recommended to use write-tsbuildinfo mode to not overwrite files emitted by the ts-loader.
            mode: 'write-references',
          },
        }),
    ].filter(Boolean),
    resolve: {
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'].filter(
        ext => useTypeScript || !ext.includes('ts')
      ),
      alias: {
        '@': paths.appSrc,
      },
    },
    stats: {
      preset: 'none',
      builtAt: true,
      assets: true,
      chunks: true,
      entrypoints: true,
      timings: true,
    },
  }
}
