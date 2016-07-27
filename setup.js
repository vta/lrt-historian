'use strict'

const fs = require('fs')
const path = require('path')
const config = require('./config')

function setupLogFolders () {
  var log_paths = [
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
    } catch(e) {
      if (e.code != 'EEXIST') throw e
    }
  }
  var mkdirpSync = function (dirpath) {
    // http://stackoverflow.com/a/24311711/940217
    var parts = dirpath.split(path.sep)
    for ( var i = 1; i <= parts.length; i++) {
      mkdirSync(path.join.apply(null, parts.slice(0, i)))
    }
  }

  function touch (file) {
    try {
      fs.existsSync(file, function (file_exists) {
        if (!file_exists) {
          fs.closeSync(fs.openSync(file, 'w'))
        }
      })
    } catch (err) {
      console.err(err)
    }
  }

  for (var i = log_paths.length - 1; i >= 0; i--) {
    console.log('creating folder at ' + log_paths[i]['dir'])
    mkdirpSync(log_paths[i]['dir'])
    for (var j = log_paths[i]['files'].length - 1; j >= 0; j--) {
      console.log('creating file at ' + log_paths[i]['files'][j])
      touch(log_paths[i]['files'][j])
    }
  }
}

(function () {
  setupLogFolders()
})()
