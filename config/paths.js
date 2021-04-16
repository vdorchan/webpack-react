const path = require('path')
const fs = require('fs')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appSrc: resolveApp('src'),
  appIndexJS: resolveApp('src/index'),
  appHtml: resolveApp('public/index.html'),

  publicUrlOrPath: '/',
  appBuild: path.resolve(appDirectory, 'dist'),
  appTsConfig: resolveApp('tsconfig.json'),
  appPackageJson: resolveApp('package.json'),
  appDirectory
}