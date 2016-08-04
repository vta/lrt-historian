'use strict'

const fs = require('fs')
const path = require('path')
const config = require('./config')

function setupLogFolders () {
  var logPaths = [
    {'dir': config.logs_dir,
      'files': [
        config.std_out_logs,
        config.std_err_logs]
    },
    {
      'dir': config.forever_logs_dir,
      'files': [
        config.forever_logFile,
        config.forever_outFile,
        config.forever_errFile]
    }
  ]

  function mkdirSync (path) {
    try {
      fs.mkdirSync(path)
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
    }
  }
  var mkdirpSync = function (dirpath) {
    // http://stackoverflow.com/a/24311711/940217
    var parts = dirpath.split(path.sep)
    for (var i = 1; i <= parts.length; i++) {
      mkdirSync(path.join.apply(null, parts.slice(0, i)))
    }
  }

  function touch (file) {
    try {
      fs.existsSync(file, function (fileExists) {
        if (!fileExists) {
          fs.closeSync(fs.openSync(file, 'w'))
        }
      })
    } catch (err) {
      console.err(err)
    }
  }

  for (var i = logPaths.length - 1; i >= 0; i--) {
    console.log('creating folder at ' + logPaths[i]['dir'])
    mkdirpSync(logPaths[i]['dir'])
    for (var j = logPaths[i]['files'].length - 1; j >= 0; j--) {
      console.log('creating file at ' + logPaths[i]['files'][j])
      touch(logPaths[i]['files'][j])
    }
  }
}

(function () {
  setupLogFolders()
})()
