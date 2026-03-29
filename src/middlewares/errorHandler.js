'use strict';

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación.',
      errors:  messages,
    });
  }

  // Violación de restricción única (email, ruc, etc.)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    return res.status(409).json({
      success: false,
      message: `El valor de '${field}' ya está registrado.`,
    });
  }

  // Error de clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida a un registro inexistente.',
    });
  }

  // Error operacional (lanzado con AppError)
  if (err.isOperational) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Error desconocido
  logger.error('[ERROR NO CONTROLADO]', { message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };