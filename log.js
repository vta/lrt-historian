const winston = require('winston')
const config = require('./config')

var logger = new (winston.Logger)({
  transports: [
    // new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: config.std_out_logs, json: false })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({
      filename: config.std_err_logs,
      maxsize: config.rollingLogSize,
      json: false
    })
  ],
  exitOnError: false
})

module.exports = logger
