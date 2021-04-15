'use strict'

const fs = require('fs')
const paths = require('./paths')
const path = require('path')

const host = process.env.HOST || '0.0.0.0'

module.exports = function (proxy, allowedHost) {
  return {
    disableHostCheck: true,
    compress: true,
    noInfo: true,
    contentBase: paths.appPublic,
    contentBasePublicPath: paths.publicUrlOrPath,
    watchContentBase: true,
    hot: true,
    publicPath: paths.publicUrlOrPath.slice(0, -1),
    host,
    public: allowedHost,
    proxy,
    stats: 'none',
  }
}
