// npm
const winston = require('winston')
// local
const { env, toVolume } = require('./utils')

const fileOptions = {
  maxSize: '128m',
  maxFiles: '14d',
  json: true,
  colorize: false,
}

const exceptionHandlers = [
  new winston.transports.File({
    ...fileOptions,
    name: 'Error Logs',
    filename: toVolume('logs/exceptions.log'),
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(winston.format.timestamp()),
  }),
]

const levelFilter = level =>
  winston.format(info => {
    return info.level === level ? info : false
  })()

const transports = [
  new winston.transports.File({
    ...fileOptions,
    name: 'Error Logs',
    filename: toVolume('logs/error.log'),
    level: 'error',
    format: winston.format.combine(levelFilter('error'), winston.format.timestamp(), winston.format.json()),
  }),
  new winston.transports.File({
    ...fileOptions,
    name: 'INFO logs',
    filename: toVolume('logs/info.log'),
    level: 'info',
    format: winston.format.combine(levelFilter('info'), winston.format.timestamp(), winston.format.json()),
  }),
  new winston.transports.File({
    ...fileOptions,
    name: 'Warn logs',
    filename: toVolume('logs/warn.log'),
    level: 'warn',
    format: winston.format.combine(levelFilter('warn'), winston.format.timestamp(), winston.format.json()),
  }),
  new winston.transports.Console({
    level: 'info',
    json: false,
    colorize: true,
    silent: env.isTest,
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
]

const logger = winston.createLogger({
  transports,
  exceptionHandlers,
  level: 'info',
  exitOnError: false,
  // Default format
  format: winston.format.combine(winston.format.timestamp()),
})

const logError = logger.error

logger.error = (message, value) => {
  const createObjectFromError = ({ message, stack }) => ({ message, stack })
  const opts = value instanceof Error ? createObjectFromError(value) : value
  logError(message, opts)
}

module.exports = logger
