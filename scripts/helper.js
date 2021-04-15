// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/WebpackDevServerUtils.js
'use strict'

const address = require('address')
const fs = require('fs')
const path = require('path')
const url = require('url')
const chalk = require('chalk')
const detect = require('detect-port-alt')
const prompts = require('prompts')

const isInteractive = process.stdout.isTTY

function prepareUrls(protocol, host, port, pathname = '/') {
  const formatUrl = hostname =>
    url.format({
      protocol,
      hostname,
      port,
      pathname,
    })
  const prettyPrintUrl = hostname =>
    url.format({
      protocol,
      hostname,
      port: chalk.bold(port),
      pathname,
    })

  const isUnspecifiedHost = host === '0.0.0.0' || host === '::'
  let prettyHost, lanUrlForConfig, lanUrlForTerminal
  if (isUnspecifiedHost) {
    prettyHost = 'localhost'
    try {
      // This can only return an IPv4 address
      lanUrlForConfig = address.ip()
      if (lanUrlForConfig) {
        // Check if the address is a private ip
        // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForConfig
          )
        ) {
          // Address is private, format it for later use
          lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig)
        } else {
          // Address is not private, so we will discard it
          lanUrlForConfig = undefined
        }
      }
    } catch (_e) {
      // ignored
    }
  } else {
    prettyHost = host
  }
  const localUrlForTerminal = prettyPrintUrl(prettyHost)
  const localUrlForBrowser = formatUrl(prettyHost)
  return {
    lanUrlForConfig,
    lanUrlForTerminal,
    localUrlForTerminal,
    localUrlForBrowser,
  }
}

function printInstructions(appName, urls, useYarn) {
  console.log()
  console.log(`You can now view ${chalk.bold(appName)} in the browser.`)
  console.log()

  if (urls.lanUrlForTerminal) {
    console.log(
      `  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`
    )
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
    )
  } else {
    console.log(`  ${urls.localUrlForTerminal}`)
  }

  console.log()
  console.log('Note that the development build is not optimized.')
  console.log(
    `To create a production build, use ` +
      `${chalk.cyan(`${useYarn ? 'yarn' : 'npm run'} build`)}.`
  )
  console.log()
}

function resolveLoopback(proxy) {
  const o = url.parse(proxy)
  o.host = undefined
  if (o.hostname !== 'localhost') {
    return proxy
  }
  // Unfortunately, many languages (unlike node) do not yet support IPv6.
  // This means even though localhost resolves to ::1, the application
  // must fall back to IPv4 (on 127.0.0.1).
  // We can re-enable this in a few years.
  /*try {
    o.hostname = address.ipv6() ? '::1' : '127.0.0.1';
  } catch (_ignored) {
    o.hostname = '127.0.0.1';
  }*/

  try {
    // Check if we're on a network; if we are, chances are we can resolve
    // localhost. Otherwise, we can just be safe and assume localhost is
    // IPv4 for maximum compatibility.
    if (!address.ip()) {
      o.hostname = '127.0.0.1'
    }
  } catch (_ignored) {
    o.hostname = '127.0.0.1'
  }
  return url.format(o)
}

// We need to provide a custom onError function for httpProxyMiddleware.
// It allows us to log custom error messages on the console.
function onProxyError(proxy) {
  return (err, req, res) => {
    const host = req.headers && req.headers.host
    console.log(
      chalk.red('Proxy error:') +
        ' Could not proxy request ' +
        chalk.cyan(req.url) +
        ' from ' +
        chalk.cyan(host) +
        ' to ' +
        chalk.cyan(proxy) +
        '.'
    )
    console.log(
      'See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (' +
        chalk.cyan(err.code) +
        ').'
    )
    console.log()

    // And immediately send the proper error response to the client.
    // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
    if (res.writeHead && !res.headersSent) {
      res.writeHead(500)
    }
    res.end(
      'Proxy error: Could not proxy request ' +
        req.url +
        ' from ' +
        host +
        ' to ' +
        proxy +
        ' (' +
        err.code +
        ').'
    )
  }
}

function choosePort(host, defaultPort) {
  return detect(defaultPort, host).then(
    port =>
      new Promise(resolve => {
        if (port === defaultPort) {
          return resolve(port)
        }
        const message = `Something is already running on port ${defaultPort}.`
        if (isInteractive) {
          clearConsole()
          const existingProcess = getProcessForPort(defaultPort)
          const question = {
            type: 'confirm',
            name: 'shouldChangePort',
            message:
              chalk.yellow(
                message +
                  `${existingProcess ? ` Probably:\n  ${existingProcess}` : ''}`
              ) + '\n\nWould you like to run the app on another port instead?',
            initial: true,
          }
          prompts(question).then(answer => {
            if (answer.shouldChangePort) {
              resolve(port)
            } else {
              resolve(null)
            }
          })
        } else {
          console.log(chalk.red(message))
          resolve(null)
        }
      }),
    err => {
      throw new Error(
        chalk.red(`Could not find an open port at ${chalk.bold(host)}.`) +
          '\n' +
          ('Network error message: ' + err.message || err) +
          '\n'
      )
    }
  )
}

function clearConsole() {
  process.stdout.write(
    process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
  )
}

function getProcessForPort(port) {
  try {
    var processId = getProcessIdOnPort(port)
    var directory = getDirectoryOfProcessById(processId)
    var command = getProcessCommand(processId, directory)
    return (
      chalk.cyan(command) +
      chalk.grey(' (pid ' + processId + ')\n') +
      chalk.blue('  in ') +
      chalk.cyan(directory)
    )
  } catch (e) {
    return null
  }
}

function getInstructions(appName, urls, useYarn) {
  let message = ''

  message += `You can now view ${chalk.bold(appName)} in the browser.`
  message += '\n'
  message += '\n'

  if (urls.lanUrlForTerminal) {
    message += `  ${chalk.bold('Local:')}            ${
      urls.localUrlForTerminal
    }`

    message += '\n'

    message += `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
  } else {
    message += `  ${urls.localUrlForTerminal}`
  }

  message += '\n'
  message += '\n'
  message += 'Note that the development build is not optimized.'
  message += '\n'
  message +=
    `To create a production build, use ` +
    `${chalk.cyan(`${useYarn ? 'yarn' : 'npm run'} build`)}.`

  message += '\n'

  return message
}

module.exports = {
  choosePort,
  prepareUrls,
  clearConsole,
  getInstructions,
}
