'use strict'

const forever = require('forever-monitor')
var pjson = require('./package.json')
const config = require('./config')

var child = new (forever.Monitor)('historian.js', {
  max: 3,
  silent: true,
  args: [],
  'logFile': config.forever_logFile, // Path to log output from forever process (when daemonized)
  'outFile': config.forever_outFile, // Path to log output from child stdout
  'errFile': config.forever_errFile, // Path to log output from child stderr
})

child.on('exit', function () {
  console.log(pjson.name + 'has exited after 3 restarts')
})
child.start()
