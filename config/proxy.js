module.exports = {
  '/api/': {
    target: 'https://github.com/',
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
}
