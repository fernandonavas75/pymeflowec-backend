'use strict';

const { body } = require('express-validator');

const createRules = [
  body('tax_name').trim().notEmpty().withMessage('El nombre es requerido.'),
  body('percentage').isFloat({ min: 0, max: 100 }).withMessage('El porcentaje debe estar entre 0 y 100 (ej: 15 para 15%).'),
  body('valid_from').optional({ nullable: true }).isDate().withMessage('Fecha de inicio de vigencia inválida.'),
  body('valid_to').optional({ nullable: true }).isDate().withMessage('Fecha de fin de vigencia inválida.'),
];

const updateRules = [
  body('tax_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('El porcentaje debe estar entre 0 y 100.'),
  body('valid_from').optional({ nullable: true }).isDate().withMessage('Fecha de inicio de vigencia inválida.'),
  body('valid_to').optional({ nullable: true }).isDate().withMessage('Fecha de fin de vigencia inválida.'),
  body('is_active').optional().isBoolean(),
];

module.exports = { createRules, updateRules };
