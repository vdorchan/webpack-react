'use strict'

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

const WebpackDevServer = require('webpack-dev-server')
const webpack = require('webpack')
const chalk = require('chalk')
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const formatMessages = require('webpack-format-messages')
const WebpackBar = require('webpackbar')

const {
  choosePort,
  prepareUrls,
  clearConsole,
  getInstructions,
} = require('./helper')

const configFactory = require('../config/webpack.config')
const paths = require('../config/paths')
const createDevServerConfig = require('../config/webpackDevServer.config')

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 9000
const HOST = '0.0.0.0'

choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    const appName = require(paths.appPackageJson).name
    const protocol = 'http'

    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    )

    const config = configFactory('development')
    const compiler = webpack(config)

    compiler.hooks.done.tap('done', stats => {
      process.nextTick(() => {
        const messages = formatMessages(stats)

        if (!messages.errors.length && !messages.warnings.length) {
          console.log(getInstructions(appName, urls, false))
        }

        if (messages.errors.length) {
          console.log('Failed to compile.')
          messages.errors.forEach(e => console.log(e))
          return
        }

        if (messages.warnings.length) {
          console.log('Compiled with warnings.')
          messages.warnings.forEach(w => console.log(w))
        }
      })
    })

    const proxyConfig = require('../config/proxy')
    const serverConfig = createDevServerConfig(
      proxyConfig,
      urls.lanUrlForConfig
    )

    const devServer = new WebpackDevServer(compiler, serverConfig)

    devServer.listen(port, HOST, err => {
      if (err) {
        console.log(err)
      }
    })
  })
  .catch(err => {
    console.log(err.message)
  })
