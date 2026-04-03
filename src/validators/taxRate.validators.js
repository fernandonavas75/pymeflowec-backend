'use strict';

const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido.'),
  body('percentage').isFloat({ min: 0, max: 1 }).withMessage('El porcentaje debe estar entre 0 y 1 (ej: 0.15).'),
  body('effective_from').isDate().withMessage('Fecha de inicio de vigencia inválida.'),
  body('effective_until').optional({ nullable: true }).isDate().withMessage('Fecha de fin de vigencia inválida.'),
  body('sri_code').optional().trim(),
  body('sri_percentage_code').optional().trim(),
  body('description').optional().trim(),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('percentage').optional().isFloat({ min: 0, max: 1 }).withMessage('El porcentaje debe estar entre 0 y 1.'),
  body('effective_from').optional().isDate().withMessage('Fecha de inicio de vigencia inválida.'),
  body('effective_until').optional({ nullable: true }).isDate().withMessage('Fecha de fin de vigencia inválida.'),
  body('is_active').optional().isBoolean(),
];

module.exports = { createRules, updateRules };
