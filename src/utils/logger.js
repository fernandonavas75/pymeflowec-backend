'use strict';

const path = require('path');
const { createLogger, format, transports } = require('winston');

const LOG_DIR  = path.join(process.cwd(), 'logs');
const isProd   = process.env.NODE_ENV === 'production';

const jsonFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) =>
    stack
      ? `${timestamp} [${level}]: ${message}\n${stack}`
      : `${timestamp} [${level}]: ${message}`
  )
);

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: jsonFormat,
  transports: [
    // Consola: JSON en prod, legible en dev
    new transports.Console({
      format: isProd ? jsonFormat : consoleFormat,
    }),

    // Todos los logs info+ → logs/combined.log
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      level:    'info',
      maxsize:  10 * 1024 * 1024, // 10 MB por archivo
      maxFiles: 7,                 // retener 7 archivos (≈ 1 semana)
      tailable: true,
    }),

    // Solo errores → logs/errors.log
    new transports.File({
      filename: path.join(LOG_DIR, 'errors.log'),
      level:    'error',
      maxsize:  10 * 1024 * 1024,
      maxFiles: 14,
      tailable: true,
    }),
  ],
});

module.exports = logger;