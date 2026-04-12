'use strict';

const fs   = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const LOG_DIR  = path.join(process.cwd(), 'logs');
const isProd   = process.env.NODE_ENV === 'production';

// En ECS/Lambda se puede desactivar los archivos con LOG_TO_FILE=false
// y dejar que CloudWatch capture solo stdout
const useFileTransports = process.env.LOG_TO_FILE !== 'false';

// Crea el directorio solo si se van a escribir archivos
if (useFileTransports) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

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
    // Consola: JSON en prod (CloudWatch lo indexa), legible en dev
    new transports.Console({
      format: isProd ? jsonFormat : consoleFormat,
    }),

    // Archivos: activados por defecto, desactivar en contenedores con LOG_TO_FILE=false
    ...(useFileTransports ? [
      new transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        level:    'info',
        maxsize:  10 * 1024 * 1024, // 10 MB por archivo
        maxFiles: 7,
        tailable: true,
      }),
      new transports.File({
        filename: path.join(LOG_DIR, 'errors.log'),
        level:    'error',
        maxsize:  10 * 1024 * 1024,
        maxFiles: 14,
        tailable: true,
      }),
    ] : []),
  ],
});

module.exports = logger;
