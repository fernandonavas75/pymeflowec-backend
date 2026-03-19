'use strict';

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? format.json()
        : format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, stack }) => {
              return stack
                ? `${timestamp} [${level}]: ${message}\n${stack}`
                : `${timestamp} [${level}]: ${message}`;
            })
          ),
    }),
  ],
});

module.exports = logger;